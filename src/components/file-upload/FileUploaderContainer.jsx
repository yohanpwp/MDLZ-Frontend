import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FileUploader from './FileUploader';
import {
  addUpload,
  processFile,
  removeUpload,
  selectUploads,
  selectIsProcessing
} from '../../redux/slices/fileProcessingSlice';

/**
 * Container component that connects FileUploader to Redux store
 */
const FileUploaderContainer = ({ className, multiple = false, disabled = false }) => {
  const dispatch = useDispatch();
  const uploads = useSelector(selectUploads);
  const isProcessing = useSelector(selectIsProcessing);

  const handleFileSelect = useCallback((fileData) => {
    // Add upload to store
    dispatch(addUpload({
      id: fileData.id,
      fileName: fileData.fileName,
      fileSize: fileData.fileSize,
      fileType: fileData.fileType
    }));

    // Start processing the file
    dispatch(processFile({
      id: fileData.id,
      file: fileData.file
    }));
  }, [dispatch]);

  const handleFileRemove = useCallback((fileData) => {
    dispatch(removeUpload(fileData.id));
  }, [dispatch]);

  return (
    <FileUploader
      onFileSelect={handleFileSelect}
      onFileRemove={handleFileRemove}
      disabled={disabled || isProcessing}
      multiple={multiple}
      className={className}
    />
  );
};

export default FileUploaderContainer;