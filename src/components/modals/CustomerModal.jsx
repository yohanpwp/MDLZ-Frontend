import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Save } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import {
  Form,
  FormField,
  FormInput,
  FormCheckbox,
  FormActions,
  FormSelect,
} from "../ui/Form";
import { useLanguage } from "../../contexts/LanguageContext";

const initialFormData = {
  code: "",
  name: "",
  distCode: "",
  status: "Active",
  contactPerson: "",
  contactNo: "",
  mobileNo: "",
  addr1: "",
  addr2: "",
  addr3: "",
  addr4: "",
  addr5: "",
  postalCode: "",
  customerHier3: "",
  invTermCode: "",
  creditLimit: "",
  taxRegNo: "",
  nodeDesc: "",
  branchCode: "",
  isActive: true,
};

const CustomerModal = ({
  isOpen,
  onClose,
  onSave,
  customer = null,
  isLoading = false,
  edit = true,
}) => {
  const [formData, setFormData] = useState(initialFormData);

  const [errors, setErrors] = useState({});

  const distributors = useSelector((state) => state.masterData.distributors);
  const { t } = useLanguage();
  useEffect(() => {
    if (isOpen) {
      if (customer) {
        setFormData({ ...initialFormData, ...customer });
      } else {
        setFormData(initialFormData);
      }
      setErrors({});
    }
  }, [isOpen, customer]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.code?.trim()) {
      newErrors.code = t("customer.customerCodeRequired");
    }

    if (!formData.name?.trim()) {
      newErrors.name = t("customer.customerNameRequired");
    }

    if (!formData.distCode?.trim()) {
      newErrors.distCode = t("customer.distributorRequired");
    }

    if (!formData.status?.trim()) {
      newErrors.status = t("customer.statusRequired");
    }

    if (formData.creditLimit && parseFloat(formData.creditLimit) < 0) {
      newErrors.creditLimit = t("customer.creditLimitNegative");
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
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        customer
          ? edit
            ? t("customer.editCustomer")
            : formData.code
          : t("customer.addCustomer")
      }
      size="md"
    >
      <div className="p-6">
        <Form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              label={t("customer.code")}
              required
              error={errors.code}
              className="col-span-1"
            >
              <FormInput
                value={formData.code}
                onChange={(e) => handleInputChange("code", e.target.value)}
                placeholder={edit ? t("customer.enterCustomerCode") : ""}
                error={errors.code}
                disabled={!edit}
              />
            </FormField>
            <FormField
              label={t("customer.distributor")}
              required
              error={errors.distCode}
              className="col-span-2"
            >
              {edit ? (
                <FormSelect
                  value={formData.distCode}
                  onChange={(e) =>
                    handleInputChange("distCode", e.target.value)
                  }
                  error={errors.distCode}
                  options={distributors.map((dist) => {
                    return {
                      value: dist.code,
                      label: `${dist.name} (${dist.code})`,
                    };
                  })}
                />
              ) : (
                <FormInput
                  value={formData.distCode}
                  onChange={(e) =>
                    handleInputChange("distCode", e.target.value)
                  }
                  error={errors.distCode}
                  disabled={!edit}
                />
              )}
            </FormField>

            <FormField
              label={t("customer.name")}
              required
              error={errors.name}
              className="col-span-3"
            >
              <FormInput
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder={edit ? t("customer.enterCustomerName") : ""}
                error={errors.name}
                disabled={!edit}
              />
            </FormField>

            {/* <FormField label={t("common.status")}>
              <FormSelect
                value={formData.status}
                onChange={(e) => handleInputChange("status", e.target.value)}
                options={[
                  {
                    value: "Active",
                    label: t("common.active"),
                  },
                  {
                    value: "Inactive",
                    label: t("common.inactive"),
                  },
                ]}
              ></FormSelect>
            </FormField> */}

            <FormField
              label={t("customer.contactPerson")}
              className="col-span-2"
            >
              <FormInput
                value={formData.contactPerson}
                onChange={(e) =>
                  handleInputChange("contactPerson", e.target.value)
                }
                placeholder={edit ? t("customer.enterContactPerson") : ""}
                disabled={!edit}
              />
            </FormField>

            <FormField label={t("customer.contactNo")} className="col-span-1">
              <FormInput
                value={formData.contactNo}
                onChange={(e) => handleInputChange("contactNo", e.target.value)}
                placeholder={edit ? t("customer.enterContactNo") : ""}
                disabled={!edit}
              />
            </FormField>

            <FormField
              label={t("customer.addressLine1")}
              className="col-span-3"
            >
              <FormInput
                value={formData.addr1}
                onChange={(e) => handleInputChange("addr1", e.target.value)}
                placeholder={edit ? t("customer.enterAddress") : ""}
                disabled={!edit}
              />
            </FormField>

            <FormField
              label={t("customer.addressLine2")}
              className="col-span-3"
            >
              <FormInput
                value={formData.addr2}
                onChange={(e) => handleInputChange("addr2", e.target.value)}
                disabled={!edit}
              />
            </FormField>

            <FormField
              label={t("customer.addressLine3")}
              className="col-span-1"
            >
              <FormInput
                value={formData.addr3}
                onChange={(e) => handleInputChange("addr3", e.target.value)}
                disabled={!edit}
              />
            </FormField>

            <FormField
              label={t("customer.addressLine4")}
              className="col-span-1"
            >
              <FormInput
                value={formData.addr4}
                onChange={(e) => handleInputChange("addr4", e.target.value)}
                disabled={!edit}
              />
            </FormField>

            <FormField label={t("customer.addressLine5")}>
              <FormInput
                value={formData.addr5}
                onChange={(e) => handleInputChange("addr5", e.target.value)}
                disabled={!edit}
                className="col-span-1"
              />
            </FormField>

            <FormField label={t("customer.postalCode")}>
              <FormInput
                value={formData.postalCode}
                onChange={(e) =>
                  handleInputChange("postalCode", e.target.value)
                }
                placeholder={edit ? t("customer.enterPostalCode") : ""}
                disabled={!edit}
              />
            </FormField>

            <FormField label={t("customer.mobileNo")}>
              <FormInput
                value={formData.mobileNo}
                onChange={(e) => handleInputChange("mobileNo", e.target.value)}
                placeholder={edit ? t("customer.enterMobileNo") : ""}
                disabled={!edit}
              />
            </FormField>

            <FormField label={t("customer.customerHier3")}>
              <FormInput
                value={formData.customerHier3}
                onChange={(e) =>
                  handleInputChange("customerHier3", e.target.value)
                }
                placeholder={edit ? t("customer.enterCustomerHier3") : ""}
                disabled={!edit}
              />
            </FormField>

            <FormField label={t("customer.invTermCode")}>
              <FormInput
                value={formData.invTermCode}
                onChange={(e) =>
                  handleInputChange("invTermCode", e.target.value)
                }
                placeholder={edit ? t("customer.enterInvTermCode") : ""}
                disabled={!edit}
              />
            </FormField>

            <FormField
              label={t("customer.creditLimit")}
              error={errors.creditLimit}
            >
              <FormInput
                type="number"
                min="0"
                step="0.01"
                value={formData.creditLimit}
                onChange={(e) =>
                  handleInputChange("creditLimit", e.target.value)
                }
                placeholder={edit ? t("customer.enterCreditLimit") : ""}
                error={errors.creditLimit}
                disabled={!edit}
              />
            </FormField>

            <FormField label={t("customer.taxRegNo")}>
              <FormInput
                value={formData.taxRegNo}
                onChange={(e) => handleInputChange("taxRegNo", e.target.value)}
                placeholder={edit ? t("customer.enterTaxRegNo") : ""}
                disabled={!edit}
              />
            </FormField>

            <FormField label={t("customer.nodeDesc")}>
              <FormInput
                value={formData.nodeDesc}
                onChange={(e) => handleInputChange("nodeDesc", e.target.value)}
                placeholder={edit ? t("customer.enterNodeDesc") : ""}
                disabled={!edit}
              />
            </FormField>

            <FormField label={t("customer.branchCode")}>
              <FormInput
                value={formData.branchCode}
                onChange={(e) =>
                  handleInputChange("branchCode", e.target.value)
                }
                placeholder={edit ? t("customer.enterBranchCode") : ""}
                disabled={!edit}
              />
            </FormField>

            {edit && (
              <div className="col-span-1 md:col-span-3">
                <FormCheckbox
                  label={t("customer.active")}
                  checked={formData.isActive}
                  onChange={(e) => {
                    handleInputChange("isActive", e.target.checked);
                    handleInputChange(
                      "status",
                      e.target.checked ? "Active" : "Inactive"
                    );
                  }}
                />
              </div>
            )}
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
                <Button onClick={handleSubmit} disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? t("common.saving") : t("common.save")}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={onClose}>
                {t("common.close")}
              </Button>
            )}
          </FormActions>
        </Form>
      </div>
    </Modal>
  );
};

export default CustomerModal;
