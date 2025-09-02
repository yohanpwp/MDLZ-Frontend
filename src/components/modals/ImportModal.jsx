import React, { useState } from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { Form, FormField, FormActions } from "../ui/Form";
import { Alert, AlertDescription } from "../ui/Alert";
import FileUploader from "@components/file-upload/FileUploader";

const ImportModal = ({
  isOpen,
  onClose,
  onImport,
  dataType = "data",
  acceptedFormats = [".csv"],
  requiredColumns = [],
  optionalColumns = [],
  isLoading = false,
  error = null,
}) => {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    console.log(file)
  };

  const handleImport = () => {
    if (selectedFile) {
      onImport(selectedFile);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Import ${dataType.charAt(0).toUpperCase() + dataType.slice(1)}`}
      size="md"
    >
      <div className="p-6">
        <Form onSubmit={handleImport}>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <FormField label="Select File">
            <FileUploader
              onFileSelect={handleFileSelect}
              onFileRemove={() => setSelectedFile(null)}
              disabled={isLoading}
              className="mb-4"
            />
          </FormField>

          {(requiredColumns.length > 0 || optionalColumns.length > 0) && (
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-foreground">
                File Format Requirements
              </h4>

              {requiredColumns.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Required columns:
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {requiredColumns.join(", ")}
                  </p>
                </div>
              )}

              {optionalColumns.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Optional columns:
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {optionalColumns.join(", ")}
                  </p>
                </div>
              )}
            </div>
          )}

          <FormActions>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedFile || isLoading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isLoading ? "Importing..." : "Import"}
            </Button>
          </FormActions>
        </Form>
      </div>
    </Modal>
  );
};

export default ImportModal;
