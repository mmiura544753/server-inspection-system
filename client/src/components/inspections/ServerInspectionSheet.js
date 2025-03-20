// src/components/inspections/ServerInspectionSheet.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { useInspection } from "../../hooks/useInspection";
import Loading from "../common/Loading";
import InspectionHeader from "./InspectionHeader";
import InspectionForm from "./InspectionForm";
import InspectionTable from "./InspectionTable";
import InspectionActions from "./InspectionActions";

const ServerInspectionSheet = () => {
  const navigate = useNavigate();
  
  const {
    loading,
    error,
    date,
    setDate,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    customerName,
    location,
    setLocation,
    workContent,
    setWorkContent,
    inspectionItems,
    saveStatus,
    updateResult,
    calculateCompletionRate,
    loadPreviousData,
    saveInspectionResults
  } = useInspection();

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="mx-auto bg-white p-6 rounded-lg shadow-lg max-w-6xl">
      <InspectionHeader
        customerName={customerName}
        date={date}
        setDate={setDate}
        startTime={startTime}
        setStartTime={setStartTime}
        endTime={endTime}
        setEndTime={setEndTime}
        calculateCompletionRate={calculateCompletionRate}
        error={error}
      />

      <InspectionForm
        location={location}
        setLocation={setLocation}
        workContent={workContent}
        setWorkContent={setWorkContent}
      />

      <InspectionTable
        inspectionItems={inspectionItems}
        updateResult={updateResult}
      />

      <InspectionActions
        loadPreviousData={loadPreviousData}
        saveInspectionResults={() => saveInspectionResults(navigate)}
        saveStatus={saveStatus}
        calculateCompletionRate={calculateCompletionRate}
      />
    </div>
  );
};

export default ServerInspectionSheet;
