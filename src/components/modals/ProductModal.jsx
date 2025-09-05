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
import { useLanguage } from '../../contexts/LanguageContext';

const initialFormData = {
  code: '',
  description: '',
  sizeCode: '',
  uomSmall: '',
  uomBig: '',
  convFactor: 0,
  listPrice: 0,
  isActive: true,
}

const ProductModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  product = null,
  isLoading = false,
  edit = true 
}) => {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const { t } = useLanguage();

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
        setFormData(initialFormData);
      }
      setErrors({});
    }
  }, [isOpen, product]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.code?.trim()) {
      newErrors.code = t("product.codeRequired");
    }

    if (formData.listPrice < 0) {
      newErrors.listPrice = t("product.listPriceNegative");
    }

    if (formData.convFactor < 0) {
      newErrors.convFactor = t("product.convFactorNegative");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (edit && validateForm()) {
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
      title={!edit ? formData.code : (product ? t("product.editProduct") : t("product.addProduct"))}
      size="md"
    >
      <div className="p-6">
        <Form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <FormField 
              label={t("product.code")}
              required 
              error={errors.code}
            >
              <FormInput
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder={edit ? t("product.codePlaceholder") : ''}
                error={errors.code}
                disabled={!edit}
              />
            </FormField>

            <FormField 
              label={t("product.sizeCode")}
            >
              <FormInput
                value={formData.sizeCode}
                onChange={(e) => handleInputChange('sizeCode', e.target.value)}
                placeholder={edit ? t("product.sizeCodePlaceholder") : ''}
                disabled={!edit}
              />
            </FormField>

            <FormField 
              label={t("product.description")} 
              className="col-span-2"
            >
              <FormTextarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder={edit ? t("product.descriptionPlaceholder") : ''}
                rows={3}
                disabled={!edit}
              />
            </FormField>

            <FormField 
              label={t("product.uomSmall")}
            >
              <FormSelect
                options={unitOptions}
                value={formData.uomSmall}
                onChange={(e) => handleInputChange('uomSmall', e.target.value)}
                placeholder={edit ? t("product.selectUOM") : ''}
                disabled={!edit}
              />
            </FormField>

            <FormField 
              label={t("product.uomBig")}
            >
              <FormSelect
                options={unitOptions}
                value={formData.uomBig}
                onChange={(e) => handleInputChange('uomBig', e.target.value)}
                placeholder={edit ? t("product.selectUOM") : ''}
                disabled={!edit}
              />
            </FormField>

            <FormField 
              label={t("product.convFactor")}
              error={errors.convFactor}
            >
              <FormInput
                type="number"
                min="0"
                step="0.01"
                value={formData.convFactor}
                onChange={(e) => handleInputChange('convFactor', parseFloat(e.target.value) || 0)}
                placeholder={edit ? t("product.convFactorPlaceholder") : ''}
                error={errors.convFactor}
                disabled={!edit}
              />
            </FormField>

            <FormField 
              label={t("product.price")}
              error={errors.listPrice}
            >
              <FormInput
                type="number"
                min="0"
                step="0.01"
                value={formData.listPrice}
                onChange={(e) => handleInputChange('listPrice', parseFloat(e.target.value) || 0)}
                placeholder={edit ? t("product.listPricePlaceholder") : ''}
                error={errors.listPrice}
                disabled={!edit}
              />
            </FormField>
          </div>

          <FormActions>
            {edit ? (
              <>
                <Button 
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  {t("common.cancel")}
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? t("common.saving") : t("common.save")}
                </Button>
              </>
            ) : (
              <Button 
                variant="outline"
                onClick={onClose}
              >
                {t("common.close")}
              </Button>
            )}
          </FormActions>
        </Form>
      </div>
    </Modal>
  );
};

export default ProductModal;