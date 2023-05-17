import React, { useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { useDropzone } from "react-dropzone";

import "./App.css";

function App() {
  const [pdf, setPdf] = useState(null);
  const [signatureCanvas, setSignatureCanvas] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [fileHash, setFileHash] = useState("");
  const [cpf, setCPF] = useState("");
  const [fullName, setFullName] = useState("");
  const [receivedData, setReceivedData] = useState("");

  
  window.onmessage =  (event) => {
    if (event.data != "[object Object]") {
       let receivedData = event.data;
       console.log("dentro: " + receivedData);
       localStorage.setItem("Memail",receivedData);
       setReceivedData(receivedData);
    }
  };
  

  const ZZ = localStorage.getItem('Memail');
  console.log("fora: " + ZZ);

 /*  const getGeolocation = () => {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            resolve({ latitude, longitude });
          },
          (error) => {
            reject(error);
          }
        );
      } else {
        reject(new Error("Geolocation is not supported by this browser"));
      }
    });
  }; */
  
  
  



  const getIpAddress = () => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", "https://api.ipify.org?format=json");
  
      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            const ipAddress = response.ip;
            resolve(ipAddress);
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error("Failed to get IP address"));
        }
      };
  
      xhr.onerror = () => {
        reject(new Error("Failed to make a request"));
      };
  
      xhr.send();
    });
  };



  const addFooter = async (pdfDoc) => {
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
    for (const page of pages) {
      const { width, height } = page.getSize();
      const textSize = 10;
      const textX = 10;
      const textY = 5;
  
      page.drawText("Assinado eletronicamente", {
        x: textX,
        y: textY,
        font,
        size: textSize,
        color: rgb(0, 0, 0),
      });
      const signatureImage = signatureCanvas.toDataURL("image/png");
      const pngImage = await pdfDoc.embedPng(signatureImage);
      const signatureWidth = 100;
      const signatureHeight = 50;//(signatureWidth / width) * height;
      const signatureX = 10;
      const signatureY = 15;

      page.drawImage(pngImage, {
        x: signatureX,
        y: signatureY,
        width: signatureWidth,
        height: signatureHeight,
      });
    
    
    }
  };
  

  const handlePdfUpload = (acceptedFiles) => {
    const file = acceptedFiles[0];
    setPdf(file);
    setFileHash("");
  };
  
  const Dropzone = () => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop: handlePdfUpload });
  
    return (
      
      <div {...getRootProps()} className={`dropzone ${isDragActive ? "active" : ""}`}>
        <input {...getInputProps()} accept=".pdf" />
        {isDragActive ? (
          <p>Arraste o PDF aqui...</p>
        ) : (
          <p>Arraste o PDF aqui ou clique para escolher o arquivo</p>
        )}
      </div>
      
    );
  };
  



  //const handlePdfUpload = (event) => {
 //   const file = event.target.files[0];
 //   setPdf(file);
 //   setFileHash("");
 // };

  const handleSignPdf = async () => {
    if (!pdf || !signatureCanvas) return;

    const ipAddress = await getIpAddress();
    const timestamp = new Date().toLocaleString();
    

    //const enteredCPF = prompt("Informe seu CPF:");
    //const enteredFullName = prompt("Informe seu nome Completo:");
  
    // Validate the entered CPF and full name if needed
    // ...
  
   // setCPF(enteredCPF);
   // setFullName(enteredFullName);

/*     let geolocation = null;
    try {
      geolocation = await getGeolocation();
    } catch (error) {
      console.error("Failed to retrieve geolocation:", error);
    } */



    const fileHash = await calculateFileHash(pdf);  
    setFileHash(fileHash);

    const reader = new FileReader();
    reader.onload = async () => {


      const pdfData = new Uint8Array(reader.result);
      const pdfDoc = await PDFDocument.load(pdfData);
      const [page] = pdfDoc.getPages();

    //  const signatureImage = signatureCanvas.toDataURL("image/png");
    //  const pngImage = await pdfDoc.embedPng(signatureImage);

      const { width, height } = page.getSize();
     

      const newPage = pdfDoc.addPage();
      const pageHeight = newPage.getHeight();

   //   const signatureWidth = 100;
   //   const signatureHeight = 50;//(signatureWidth / width) * height;
    //  const signatureX = 10;
    //  const signatureY = 15;

    //  newPage.drawImage(pngImage, {
    //    x: signatureX,
    //    y: signatureY,
    //    width: signatureWidth,
    //    height: signatureHeight,
    //  });
      //const { latitude, longitude } = geolocation;
      //const hashText = `SHA-256 do documento original:${fileHash}\nAssinado por:${enteredFullName} Em: ${timestamp}\nCPF: ${enteredCPF}\n Lat:${latitude}Long${longitude} IP: ${ipAddress}`;
      //const receivedDataString = JSON.stringify(receivedData);
      const hashText = `SHA-256 do documento original:${fileHash}\nAssinado Em: ${timestamp}\n IP: ${ipAddress}\n  ${receivedData}`;
      const hashX = 10;
      const hashY = 140;

      newPage.drawText(hashText, {
        x: hashX,
        y: hashY,
        font: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        size: 8,
        color: rgb(0, 0, 0),
      });


      


      const modifiedPdfBytes = await pdfDoc.save();
      const modifiedPdfBlob = new Blob([modifiedPdfBytes], {
        type: "application/pdf",
      });


      const pdfDocWithFooter = await PDFDocument.load(modifiedPdfBytes);
      await addFooter(pdfDocWithFooter);
    
      const modifiedPdfBytesWithFooter = await pdfDocWithFooter.save();
      const modifiedPdfBlobWithFooter = new Blob([modifiedPdfBytesWithFooter], {
        type: "application/pdf",
      });



      const downloadUrl = URL.createObjectURL(modifiedPdfBlobWithFooter);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "signed.pdf";
      link.click();
      URL.revokeObjectURL(downloadUrl);
    };

    reader.readAsArrayBuffer(pdf);



    
  };

 


  const handlePreviewSignature = () => {
    if (signatureCanvas) {
      const signatureImage = signatureCanvas.toDataURL("image/png");
      setPreviewImage(signatureImage);
    }
  };

  const handleClearSignature = () => {
    if (signatureCanvas) {
      signatureCanvas.clear();
      setPreviewImage(null);
    }
  };

  const calculateFileHash = async (file) => {
    const buffer = await file.arrayBuffer();
    const data = new Uint8Array(buffer);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
    return hashHex;
  };

  return (
     <div className="container">
    <h1>Assinatura Eletrônica de PDF</h1>
    
  

   <Dropzone />
  

    {pdf && (
      <div className="pdf-section">
        <h2>PDF Carregado:</h2>
        <div className="pdf-container">
        <object
          data={URL.createObjectURL(pdf)}
          type="application/pdf"
          width="100%"
          height="500px"
        >
          <p>Seu navegador não suporta visualização de PDFs.</p>
        </object>
        </div>

        <h2>Desenhe sua Assinatura:</h2>
        
        <div className="signature-container">
          <SignatureCanvas
            penColor="black"
            canvasProps={{
              width: 400,
              height: 200,
              className: "signature-canvas",
            
            }}
            ref={(ref) => setSignatureCanvas(ref)}
            style="border: dashed;"/>

          <div className="signature-preview">
            <h3></h3>
            {previewImage && (
              <img
                src={previewImage}
                alt="Pré-visualização da Assinatura"
                className="preview-image"
              />
            )}

<div className="signature-buttons">
             
              <button onClick={handleClearSignature}>Limpar</button>
            </div>
          </div>
        </div>

        {previewImage && (
            <div className="signature-info">
            <h4>SHA-256:</h4>
            <p>{fileHash}</p>
          </div>
        )}

        <button className="sign-button" onClick={handleSignPdf}>Assinar PDF</button>
      </div>

      
    )
    
    
    }


    
  </div>

);




}

export default App;

