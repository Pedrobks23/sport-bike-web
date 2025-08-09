import React from "react";
import MUIDataTable from "mui-datatables";

const GenericDataTable = ({ columns, data, title, options = {}, loading = false }) => {
  const defaultOptions = {
    sortFilterList: false,
    filter: false,
    search: true,
    print: true,
    download: true,
    sort: true,
    rowsPerPage: 100,
    selectableRows: "none",
    responsive: "standard",
    tableBodyHeight: "auto",
    tableBodyMaxHeight: "60vh",
  };

  const mergedOptions = { ...defaultOptions, ...options };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <MUIDataTable title={title} data={data} columns={columns} options={mergedOptions} />
  );
};

export default GenericDataTable;

