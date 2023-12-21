import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import axios from "axios";

type CSVFileImportProps = {
  url: string;
  title: string;
};

export default function CSVFileImport({ url, title }: CSVFileImportProps) {
  const [file, setFile] = React.useState<File>();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFile(file);
    }
  };

  const removeFile = () => {
    setFile(undefined);
  };

  const uploadFile = async () => {
    console.log("uploadFile to", url);
    const authToken = localStorage.getItem("authorization_token");

    const response = await axios({
      method: "GET",
      headers: {
        Authorization: `Basic ${authToken ? authToken : ''}`,
      },
      url,
      params: {
        name: encodeURIComponent((file as File).name),
      },
    });
    console.log("File to upload: ", (file as File).name);
    console.log("Uploading to: ", response.data);
    const result = await fetch(response.data.signedUrl, {
      method: "PUT",
      body: file,
    });
    console.log("Result: ", result);
    setFile(undefined);
  };
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.request.status === 401) {
        alert('Unauthorized')
      } else if (error.request.status === 403) {
        alert('Access Denied')
      } else {
        console.log(error)
      }
      return Promise.reject(error);
    }
  );
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {!file ? (
        <input type="file" onChange={onFileChange} />
      ) : (
        <div>
          <button onClick={removeFile}>Remove file</button>
          <button onClick={uploadFile}>Upload file</button>
        </div>
      )}
    </Box>
  );
}
