// src/App.jsx
import { useEffect, useState, useRef } from "react";
import QRCode from "react-qr-code";
import "fast-text-encoding";
import {
  Container,
  TextField,
  Typography,
  Box,
  Paper,
  Button,
  Stack,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Snackbar,
  Alert
} from "@mui/material";

const LABELS = {
  Name: "ФИО",
  PersonalAcc: "Лицевой счет",
  BankName: "Банк",
  BIC: "БИК",
  CorrespAcc: "Корреспондентский счет",
  PayeeINN: "ИНН получателя",
  Purpose: "Назначение платежа",
  Sum: "Сумма, руб. (не обязательно)",
};

const defaultFields = {
  Name: "",
  PersonalAcc: "",
  BankName: "ПАО Сбербанк",
  BIC: "044525225",
  CorrespAcc: "30101810400000000225",
  PayeeINN: "",
  Purpose: "Оплата услуг",
  Sum: ""
};

const darkTheme = createTheme({
  palette: {
    mode: "dark"
  }
});

export default function App() {
  const [fields, setFields] = useState(() => {
    const stored = localStorage.getItem("qrForm");
    const result = stored ? JSON.parse(stored) : defaultFields;
    result.Sum = result.Sum ? String(Number(result.Sum) / 100) : "";
    return result;
  });

  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const qrRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("qrForm", JSON.stringify({
      ...fields,
      Sum: fields.Sum ? String(Number(fields.Sum) * 100) : "",
    }));
    const newErrors = {};
    Object.entries(fields).forEach(([key, value]) => {
      if (key !== "Sum" && !value.trim()) {
        newErrors[key] = true;
      }
    });
    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0);
  }, [fields]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        const pngUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = "qr-code.png";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(pngUrl);
      }, "image/png");
    };
  };

  const handleCopy = async () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const canvas = document.createElement("canvas");
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = async () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      try {
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);
        setCopySuccess(true);
      } catch (err) {
        alert("Ошибка копирования изображения: " + err.message);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      alert("Не удалось загрузить изображение для копирования");
    };
  };

  const qrData = `ST00012|Name=${fields.Name}|PersonalAcc=${fields.PersonalAcc}|BankName=${fields.BankName}|BIC=${fields.BIC}|CorrespAcc=${fields.CorrespAcc}|PayeeINN=${fields.PayeeINN}|Purpose=${fields.Purpose}${fields.Sum ? `|Sum=${Number(fields.Sum) * 100}` : ""}`;

  const encoder = new TextEncoder("windows-1251");
  const encodedData = encoder.encode(qrData);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Container maxWidth="sm" sx={{ py: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Typography variant="h4" gutterBottom align="center">
          Генератор QR для платежей
        </Typography>

        <Box component="form" display="flex" flexDirection="column" gap={2} width="100%">
          {Object.keys(fields).map((key) => (
            <TextField
              key={key}
              label={LABELS[key] || key}
              name={key}
              value={fields[key]}
              onChange={handleChange}
              variant="outlined"
              fullWidth
              error={!!errors[key]}
              helperText={errors[key] ? "Обязательное поле" : ""}
            />
          ))}
        </Box>

        {isValid && (
          <Box ref={qrRef} mt={4} textAlign="center">
            <Paper elevation={3} sx={{ display: "inline-block", padding: 2, backgroundColor: "#fff" }}>
              <QRCode
                value={String.fromCharCode(...encodedData)}
                size={256}
                bgColor="#fff"
                fgColor="#000"
              />
            </Paper>
            <Typography variant="body2" mt={2} sx={{ wordBreak: "break-all" }}>
              {qrData}
            </Typography>

            <Stack direction="row" spacing={2} justifyContent="center" mt={2}>
              <Button variant="contained" onClick={handleDownload}>
                Скачать
              </Button>
              <Button variant="outlined" onClick={handleCopy}>
                Скопировать
              </Button>
            </Stack>
          </Box>
        )}
        <Snackbar
          open={copySuccess}
          autoHideDuration={3000}
          onClose={() => setCopySuccess(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity="success"
            variant="filled"
            sx={{ width: "100%" }}
            onClose={() => setCopySuccess(false)}
          >
            QR-код скопирован в буфер обмена
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}