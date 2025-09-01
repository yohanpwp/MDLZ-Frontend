/**
 * Data Adapter Interface
 * รองรับทั้ง file-based และ API-based data operations
 */

export class IDataAdapter {
  /**
   * อ่านข้อมูลจาก data source
   * @param {Object} options - ตัวเลือกสำหรับการอ่านข้อมูล
   * @returns {Promise<Object>} ข้อมูลที่อ่านได้
   */
  async read(options = {}) {
    throw new Error('Method read() must be implemented')
  }

  /**
   * เขียนข้อมูลไปยัง data source
   * @param {Object} data - ข้อมูลที่จะเขียน
   * @param {Object} options - ตัวเลือกสำหรับการเขียน
   * @returns {Promise<Object>} ผลลัพธ์การเขียน
   */
  async write(data, options = {}) {
    throw new Error('Method write() must be implemented')
  }

  /**
   * อัพเดทข้อมูล
   * @param {string} id - ID ของข้อมูล
   * @param {Object} data - ข้อมูลที่จะอัพเดท
   * @param {Object} options - ตัวเลือกสำหรับการอัพเดท
   * @returns {Promise<Object>} ข้อมูลที่อัพเดทแล้ว
   */
  async update(id, data, options = {}) {
    throw new Error('Method update() must be implemented')
  }

  /**
   * ลบข้อมูล
   * @param {string} id - ID ของข้อมูลที่จะลบ
   * @param {Object} options - ตัวเลือกสำหรับการลบ
   * @returns {Promise<boolean>} ผลลัพธ์การลบ
   */
  async delete(id, options = {}) {
    throw new Error('Method delete() must be implemented')
  }

  /**
   * ค้นหาข้อมูล
   * @param {Object} query - เงื่อนไขการค้นหา
   * @param {Object} options - ตัวเลือกสำหรับการค้นหา
   * @returns {Promise<Array>} ผลลัพธ์การค้นหา
   */
  async search(query, options = {}) {
    throw new Error('Method search() must be implemented')
  }

  /**
   * ตรวจสอบสถานะการเชื่อมต่อ
   * @returns {Promise<boolean>} สถานะการเชื่อมต่อ
   */
  async isConnected() {
    throw new Error('Method isConnected() must be implemented')
  }

  /**
   * ซิงค์ข้อมูล
   * @param {Object} options - ตัวเลือกสำหรับการซิงค์
   * @returns {Promise<Object>} ผลลัพธ์การซิงค์
   */
  async sync(options = {}) {
    throw new Error('Method sync() must be implemented')
  }
}

/**
 * Data Source Types
 */
export const DATA_SOURCE_TYPES = {
  FILE: 'file',
  API: 'api',
  LOCAL_STORAGE: 'localStorage',
  INDEXED_DB: 'indexedDB'
}

/**
 * Operation Types
 */
export const OPERATION_TYPES = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  SYNC: 'sync'
}