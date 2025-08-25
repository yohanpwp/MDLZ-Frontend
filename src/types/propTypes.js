import PropTypes from 'prop-types';

// Invoice related PropTypes
export const InvoicePropTypes = {
  id: PropTypes.string.isRequired,
  invoiceNumber: PropTypes.string.isRequired,
  vendorName: PropTypes.string.isRequired,
  amount: PropTypes.number.isRequired,
  date: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['pending', 'approved', 'rejected']).isRequired,
  validationResults: PropTypes.arrayOf(PropTypes.shape({
    field: PropTypes.string.isRequired,
    isValid: PropTypes.bool.isRequired,
    message: PropTypes.string
  }))
};

// Validation Rule PropTypes
export const ValidationRulePropTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  isActive: PropTypes.bool.isRequired,
  ruleType: PropTypes.oneOf(['format', 'range', 'required', 'custom']).isRequired,
  parameters: PropTypes.object
};

// User PropTypes
export const UserPropTypes = {
  id: PropTypes.string.isRequired,
  username: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  role: PropTypes.oneOf(['admin', 'user', 'viewer']).isRequired,
  permissions: PropTypes.arrayOf(PropTypes.string)
};

// Common UI PropTypes
export const ButtonPropTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['default', 'destructive', 'outline', 'secondary', 'ghost', 'link']),
  size: PropTypes.oneOf(['default', 'sm', 'lg', 'icon']),
  disabled: PropTypes.bool,
  onClick: PropTypes.func
};

export const InputPropTypes = {
  type: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string
};