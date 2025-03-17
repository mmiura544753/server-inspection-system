// src/components/inspectionItems/InspectionItemForm.js
import React from "react";
import { useParams } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import Loading from "../common/Loading";
import Alert from "../common/Alert";

// フォームロジックのカスタムフック
import { useInspectionItemForm } from "../../hooks/useInspectionItemForm";

// フォームコンポーネント
import CustomerSelect from "./forms/CustomerSelect";
import LocationSelect from "./forms/LocationSelect";
import DeviceSelect from "./forms/DeviceSelect";
import InspectionItemNameInput from "./forms/InspectionItemNameInput";
import FormActionButtons from "./forms/FormActionButtons";

// バリデーションスキーマ
const InspectionItemSchema = Yup.object().shape({
  customer_id: Yup.number().required("顧客の選択は必須です"),
  location: Yup.string().nullable(),
  device_id: Yup.number().required("機器の選択は必須です"),
  item_name: Yup.string()
    .required("点検項目名は必須です")
    .max(255, "点検項目名は255文字以内で入力してください"),
});

const InspectionItemForm = () => {
  const { id } = useParams();
  const { 
    isEditMode,
    item,
    customerOptions,
    locationOptions,
    deviceOptions,
    loading,
    error,
    submitError,
    updateLocationOptions,
    updateDeviceOptions,
    handleSubmit 
  } = useInspectionItemForm(id);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="container py-4">
      <div className="card">
        <div className="card-header">
          <h1 className="h3 mb-0">
            {isEditMode ? "点検項目の編集" : "新規点検項目登録"}
          </h1>
        </div>
        <div className="card-body">
          {error && <Alert type="danger" message={error} />}
          {submitError && <Alert type="danger" message={submitError} />}

          <Formik
            initialValues={item}
            validationSchema={InspectionItemSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ isSubmitting, setFieldValue, values, errors, touched }) => (
              <Form className="form-container">
                <CustomerSelect 
                  customerOptions={customerOptions}
                  value={customerOptions.find(option => option.value === parseInt(values.customer_id, 10) || 0)}
                  onChange={(selectedOption) => {
                    setFieldValue("customer_id", selectedOption ? selectedOption.value : "");
                    setFieldValue("location", "");
                    setFieldValue("device_id", "");
                    
                    if (selectedOption) {
                      updateLocationOptions(selectedOption.value);
                      updateDeviceOptions(selectedOption.value, "");
                    } else {
                      setFieldValue("location", "");
                      setFieldValue("device_id", "");
                    }
                  }}
                  errors={errors.customer_id}
                  touched={touched.customer_id}
                />

                <LocationSelect 
                  locationOptions={locationOptions}
                  value={locationOptions.find(option => option.value === values.location)}
                  onChange={(selectedOption) => {
                    setFieldValue("location", selectedOption ? selectedOption.value : "");
                    setFieldValue("device_id", "");
                    
                    updateDeviceOptions(values.customer_id, selectedOption ? selectedOption.value : "");
                  }}
                  isDisabled={!values.customer_id}
                />

                <DeviceSelect 
                  deviceOptions={deviceOptions}
                  value={deviceOptions.find(option => option.value === parseInt(values.device_id, 10) || 0)}
                  onChange={(selectedOption) => {
                    setFieldValue("device_id", selectedOption ? selectedOption.value : "");
                  }}
                  isDisabled={!values.customer_id}
                  hasCustomer={!!values.customer_id}
                  errors={errors.device_id}
                  touched={touched.device_id}
                />

                <InspectionItemNameInput />

                <FormActionButtons isSubmitting={isSubmitting} />
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default InspectionItemForm;