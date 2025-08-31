import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { 
  Form, 
  FormField, 
  FormInput, 
  FormTextarea,
  FormSelect,
  FormCheckbox, 
  FormActions 
} from '../ui/Form';

const ProductModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  product = null,
  isLoading = false 
}) => {
  const [formData, setFormData] = useState({
    productCode: '',
    productName: '',
    description: '',
    category: '',
    unitPrice: 0,
    costPrice: 0,
    stockQuantity: 0,
    minStockLevel: 0,
    unit: '',
    barcode: '',
    isActive: true
  });

  const [errors, setErrors] = useState({});

  const categoryOptions = [
    { value: 'electronics', label: 'Electronics' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'books', label: 'Books' },
    { value: 'home', label: 'Home & Garden' },
    { value: 'sports', label: 'Sports & Outdoors' },
    { value: 'other', label: 'Other' }
  ];

  const unitOptions = [
    { value: 'pcs', label: 'Pieces' },
    { value: 'kg', label: 'Kilograms' },
    { value: 'lbs', label: 'Pounds' },
    { value: 'liters', label: 'Liters' },
    { value: 'meters', label: 'Meters' },
    { value: 'boxes', label: 'Boxes' }
  ];

  // Reset form when modal opens/closes or product changes
  useEffect(() => {
    if (isOpen) {
      if (product) {
        setFormData({ ...product });
      } else {
        setFormData({
          productCode: '',
          productName: '',
          description: '',
          category: '',
          unitPrice: 0,
          costPrice: 0,
          stockQuantity: 0,
          minStockLevel: 0,
          unit: '',
          barcode: '',
          isActive: true
        });
      }
      setErrors({});
    }
  }, [isOpen, product]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.productCode?.trim()) {
      newErrors.productCode = 'Product code is required';
    }

    if (!formData.productName?.trim()) {
      newErrors.productName = 'Product name is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (formData.unitPrice < 0) {
      newErrors.unitPrice = 'Unit price cannot be negative';
    }

    if (formData.costPrice < 0) {
      newErrors.costPrice = 'Cost price cannot be negative';
    }

    if (formData.stockQuantity < 0) {
      newErrors.stockQuantity = 'Stock quantity cannot be negative';
    }

    if (formData.minStockLevel < 0) {
      newErrors.minStockLevel = 'Minimum stock level cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Edit Product' : 'Add Product'}
      size="md"
    >
      <div className="p-6">
        <Form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <FormField 
              label="Product Code" 
              required 
              error={errors.productCode}
            >
              <FormInput
                value={formData.productCode}
                onChange={(e) => handleInputChange('productCode', e.target.value)}
                placeholder="Enter product code"
                error={errors.productCode}
              />
            </FormField>

            <FormField 
              label="Product Name" 
              required 
              error={errors.productName}
            >
              <FormInput
                value={formData.productName}
                onChange={(e) => handleInputChange('productName', e.target.value)}
                placeholder="Enter product name"
                error={errors.productName}
              />
            </FormField>

            <FormField 
              label="Category" 
              required 
              error={errors.category}
              className="col-span-2"
            >
              <FormSelect
                options={categoryOptions}
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                placeholder="Select category"
                error={errors.category}
              />
            </FormField>

            <FormField label="Description" className="col-span-2">
              <FormTextarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter product description"
                rows={3}
              />
            </FormField>

            <FormField 
              label="Unit Price" 
              error={errors.unitPrice}
            >
              <FormInput
                type="number"
                min="0"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => handleInputChange('unitPrice', parseFloat(e.target.value) || 0)}
                placeholder="Enter unit price"
                error={errors.unitPrice}
              />
            </FormField>

            <FormField 
              label="Cost Price" 
              error={errors.costPrice}
            >
              <FormInput
                type="number"
                min="0"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => handleInputChange('costPrice', parseFloat(e.target.value) || 0)}
                placeholder="Enter cost price"
                error={errors.costPrice}
              />
            </FormField>

            <FormField 
              label="Stock Quantity" 
              error={errors.stockQuantity}
            >
              <FormInput
                type="number"
                min="0"
                value={formData.stockQuantity}
                onChange={(e) => handleInputChange('stockQuantity', parseInt(e.target.value) || 0)}
                placeholder="Enter stock quantity"
                error={errors.stockQuantity}
              />
            </FormField>

            <FormField 
              label="Min Stock Level" 
              error={errors.minStockLevel}
            >
              <FormInput
                type="number"
                min="0"
                value={formData.minStockLevel}
                onChange={(e) => handleInputChange('minStockLevel', parseInt(e.target.value) || 0)}
                placeholder="Enter minimum stock level"
                error={errors.minStockLevel}
              />
            </FormField>

            <FormField label="Unit">
              <FormSelect
                options={unitOptions}
                value={formData.unit}
                onChange={(e) => handleInputChange('unit', e.target.value)}
                placeholder="Select unit"
              />
            </FormField>

            <FormField label="Barcode">
              <FormInput
                value={formData.barcode}
                onChange={(e) => handleInputChange('barcode', e.target.value)}
                placeholder="Enter barcode"
              />
            </FormField>

            <FormField className="col-span-2">
              <FormCheckbox
                label="Active"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
              />
            </FormField>
          </div>

          <FormActions>
            <Button 
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Product'}
            </Button>
          </FormActions>
        </Form>
      </div>
    </Modal>
  );
};

export default ProductModal;