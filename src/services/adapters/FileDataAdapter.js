import { IDataAdapter, DATA_SOURCE_TYPES } from '../interfaces/IDataAdapter.js'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

/**
 * File Data Adapter
 * จัดการข้อมูลผ่าน file import/export
 */
export class FileDataAdapter extends IDataAdapter {
  constructor(options = {}) {
    super()
    this.sourceType = DATA_SOURCE_TYPES.FILE
    this.supportedFormats = ['json', 'csv', 'xlsx', 'xls']
    this.options = {
      encoding: 'utf-8',
      delimiter: ',',
      ...options
    }
  }

  /**
   * อ่านข้อมูลจากไฟล์
   */
  async read(file, options = {}) {
    if (!file) {
      throw new Error('File is required for reading')
    }

    const fileExtension = this._getFileExtension(file.name)
    const mergedOptions = { ...this.options, ...options }

    try {
      switch (fileExtension) {
        case 'json':
          return await this._readJsonFile(file, mergedOptions)
        case 'csv':
          return await this._readCsvFile(file, mergedOptions)
        case 'xlsx':
        case 'xls':
          return await this._readExcelFile(file, mergedOptions)
        default:
          throw new Error(`Unsupported file format: ${fileExtension}`)
      }
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`)
    }
  }

  /**
   * เขียนข้อมูลเป็นไฟล์
   */
  async write(data, options = {}) {
    const {
      filename = 'export',
      format = 'json',
      download = true
    } = options

    try {
      let blob
      let mimeType
      let fileExtension

      switch (format.toLowerCase()) {
        case 'json':
          blob = this._createJsonBlob(data)
          mimeType = 'application/json'
          fileExtension = 'json'
          break
        case 'csv':
          blob = this._createCsvBlob(data, options)
          mimeType = 'text/csv'
          fileExtension = 'csv'
          break
        case 'xlsx':
          blob = this._createExcelBlob(data, options)
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          fileExtension = 'xlsx'
          break
        default:
          throw new Error(`Unsupported export format: ${format}`)
      }

      if (download) {
        this._downloadBlob(blob, `${filename}.${fileExtension}`, mimeType)
      }

      return {
        success: true,
        blob,
        filename: `${filename}.${fileExtension}`,
        size: blob.size
      }
    } catch (error) {
      throw new Error(`Failed to write file: ${error.message}`)
    }
  }

  /**
   * File adapter ไม่รองรับ update โดยตรง
   */
  async update(id, data, options = {}) {
    throw new Error('Update operation not supported for file adapter. Use write() instead.')
  }

  /**
   * File adapter ไม่รองรับ delete โดยตรง
   */
  async delete(id, options = {}) {
    throw new Error('Delete operation not supported for file adapter.')
  }

  /**
   * ค้นหาข้อมูลใน memory (หลังจาก read แล้ว)
   */
  async search(query, data) {
    if (!data || !Array.isArray(data)) {
      throw new Error('Data must be an array for searching')
    }

    const { field, value, operator = 'includes' } = query

    return data.filter(item => {
      const fieldValue = item[field]
      if (fieldValue === undefined) return false

      switch (operator) {
        case 'equals':
          return fieldValue === value
        case 'includes':
          return String(fieldValue).toLowerCase().includes(String(value).toLowerCase())
        case 'startsWith':
          return String(fieldValue).toLowerCase().startsWith(String(value).toLowerCase())
        case 'endsWith':
          return String(fieldValue).toLowerCase().endsWith(String(value).toLowerCase())
        default:
          return false
      }
    })
  }

  /**
   * File adapter เชื่อมต่อได้เสมอ (local operation)
   */
  async isConnected() {
    return true
  }

  /**
   * File adapter ไม่ต้องซิงค์
   */
  async sync(options = {}) {
    return {
      success: true,
      message: 'File adapter does not require synchronization'
    }
  }

  // Private methods
  _getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase()
  }

  async _readJsonFile(file, options) {
    const text = await this._readFileAsText(file)
    return JSON.parse(text)
  }

  async _readCsvFile(file, options) {
    const text = await this._readFileAsText(file)
    
    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        delimiter: options.delimiter,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`))
          } else {
            resolve(results.data)
          }
        },
        error: (error) => reject(error)
      })
    })
  }

  async _readExcelFile(file, options) {
    const arrayBuffer = await this._readFileAsArrayBuffer(file)
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    
    const sheetName = options.sheetName || workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    return XLSX.utils.sheet_to_json(worksheet, { header: 1 })
  }

  _readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = (e) => reject(new Error('Failed to read file as text'))
      reader.readAsText(file, this.options.encoding)
    })
  }

  _readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = (e) => reject(new Error('Failed to read file as array buffer'))
      reader.readAsArrayBuffer(file)
    })
  }

  _createJsonBlob(data) {
    const jsonString = JSON.stringify(data, null, 2)
    return new Blob([jsonString], { type: 'application/json' })
  }

  _createCsvBlob(data, options) {
    const csv = Papa.unparse(data, {
      delimiter: options.delimiter || this.options.delimiter
    })
    return new Blob([csv], { type: 'text/csv' })
  }

  _createExcelBlob(data, options) {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Sheet1')
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    return new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
  }

  _downloadBlob(blob, filename, mimeType) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }
}