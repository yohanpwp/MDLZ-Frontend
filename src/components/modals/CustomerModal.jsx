import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { 
  Form, 
  FormField, 
  FormInput, 
  FormCheckbox, 
  FormActions 
} from '../ui/Form';

const CustomerModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  customer = null,
  isLoading = false 
}) => {
  const [formData, setFormData] = useState({
    customerCode: '',
    customerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    taxId: '',
    creditLimit: 0,
    isActive: true
  });

  const [errors, setErrors] = useState({});

  // Reset form when modal opens/closes or customer changes
  useEffect(() => {
    if (isOpen) {
      if (customer) {
        setFormData({ ...customer });
      } else {
        setFormData({
          customerCode: '',
          customerName: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          country: '',
          taxId: '',
          creditLimit: 0,
          isActive: true
        });
      }
      setErrors({});
    }
  }, [isOpen, customer]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customerCode?.trim()) {
      newErrors.customerCode = 'Customer code is required';
    }

    if (!formData.customerName?.trim()) {
      newErrors.customerName = 'Customer name is required';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.creditLimit < 0) {
      newErrors.creditLimit = 'Credit limit cannot be negative';
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
      title={customer ? 'Edit Customer' : 'Add Customer'}
      size="md"
    >
      <div className="p-6">
        <Form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <FormField 
              label="Customer Code" 
              required 
              error={errors.customerCode}
            >
              <FormInput
                value={formData.customerCode}
                onChange={(e) => handleInputChange('customerCode', e.target.value)}
                placeholder="Enter customer code"
                error={errors.customerCode}
              />
            </FormField>

            <FormField 
              label="Customer Name" 
              required 
              error={errors.customerName}
            >
              <FormInput
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                placeholder="Enter customer name"
                error={errors.customerName}
              />
            </FormField>

            <FormField 
              label="Email" 
              required 
              error={errors.email}
            >
              <FormInput
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
                error={errors.email}
              />
            </FormField>

            <FormField label="Phone">
              <FormInput
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
              />
            </FormField>

            <FormField label="Address" className="col-span-2">
              <FormInput
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter address"
              />
            </FormField>

            <FormField label="City">
              <FormInput
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Enter city"
              />
            </FormField>

            <FormField label="Country">
              <FormInput
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                placeholder="Enter country"
              />
            </FormField>

            <FormField label="Tax ID">
              <FormInput
                value={formData.taxId}
                onChange={(e) => handleInputChange('taxId', e.target.value)}
                placeholder="Enter tax ID"
              />
            </FormField>

            <FormField 
              label="Credit Limit" 
              error={errors.creditLimit}
            >
              <FormInput
                type="number"
                min="0"
                step="0.01"
                value={formData.creditLimit}
                onChange={(e) => handleInputChange('creditLimit', parseFloat(e.target.value) || 0)}
                placeholder="Enter credit limit"
                error={errors.creditLimit}
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
              {isLoading ? 'Saving...' : 'Save Customer'}
            </Button>
          </FormActions>
        </Form>
      </div>
    </Modal>
  );
};

export default CustomerModal;