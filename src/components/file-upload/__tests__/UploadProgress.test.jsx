import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import UploadProgress from '../UploadProgress';

describe('UploadProgress', () => {
  it('should not render when status is idle', () => {
    const { container } = render(<UploadProgress status="idle" />);
    expect(container.firstChild).toBeNull();
  });

  it('should show uploading state correctly', () => {
    render(
      <UploadProgress 
        status="uploading" 
        progress={50} 
        fileName="test.csv" 
      />
    );
    
    expect(screen.getByText('test.csv')).toBeInTheDocument();
    expect(screen.getByText('Uploading file...')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should show processing state with record count', () => {
    render(
      <UploadProgress 
        status="processing" 
        progress={75} 
        fileName="test.csv"
        recordsProcessed={75}
        totalRecords={100}
      />
    );
    
    expect(screen.getByText('Processing records (75/100)')).toBeInTheDocument();
  });

  it('should show completed state', () => {
    render(
      <UploadProgress 
        status="completed" 
        fileName="test.csv"
        totalRecords={100}
      />
    );
    
    expect(screen.getByText('Successfully processed 100 records')).toBeInTheDocument();
    expect(screen.getByText('File processed successfully with 100 records')).toBeInTheDocument();
  });

  it('should show error state with error message', () => {
    render(
      <UploadProgress 
        status="error" 
        fileName="test.csv"
        error="Invalid file format"
      />
    );
    
    expect(screen.getByText('Upload failed')).toBeInTheDocument();
    expect(screen.getByText('Invalid file format')).toBeInTheDocument();
  });

  it('should show progress bar during upload and processing', () => {
    const { rerender } = render(
      <UploadProgress 
        status="uploading" 
        progress={30} 
        fileName="test.csv" 
      />
    );
    
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
    
    rerender(
      <UploadProgress 
        status="processing" 
        progress={60} 
        fileName="test.csv" 
      />
    );
    
    expect(screen.getByText('60%')).toBeInTheDocument();
  });
});