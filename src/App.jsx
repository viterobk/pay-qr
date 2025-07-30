// src/App.jsx
import { useEffect, useState, useRef } from "react";
import QRCode from "react-qr-code";
import {
  Container,
  TextField,
  Typography,
  Box,
  Paper,
  Button,
  Stack,
  CssBaseline
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const darkTheme = createTheme({
  palette: {
    mode: "dark"
  }
});

const LABELS = {
  Name: "ФИО",
  PersonalAcc: "Лицевой счет",
  BankName: "Банк",
  BIC: "БИК",
  CorrespAcc: "Корреспондентский счет",
  PayeeINN: "ИНН получателя",
  Purpose: "Назначение платежа",
  Sum: "Сумма (не обязательно)",
}

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

export default function App() {
  const [fields, setFields] = useState(() => {
    const stored = localStorage.getItem("qrForm");
    return stored ? JSON.parse(stored) : defaultFields;
  });

  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);
  const qrRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("qrForm", JSON.stringify(fields));
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
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "qr-code.svg";
    link.click();
    URL.revokeObjectURL(url);
  };

  const qrData = `ST00012|Name=${fields.Name}|PersonalAcc=${fields.PersonalAcc}|BankName=${fields.BankName}|BIC=${fields.BIC}|CorrespAcc=${fields.CorrespAcc}|PayeeINN=${fields.PayeeINN}|Purpose=${fields.Purpose}${fields.Sum ? `|Sum=${fields.Sum}` : ""}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrData);
      alert("QR-данные скопированы в буфер обмена");
    } catch (err) {
      alert("Ошибка копирования");
    }
  };

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
            <Paper elevation={3} sx={{ display: "inline-block", padding: 2 }}>
              <QRCode value={qrData} size={256} bgColor="#fff" fgColor="#000" />
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
      </Container>
    </ThemeProvider>
  );
}
