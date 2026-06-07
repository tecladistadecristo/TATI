import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";

type Props = {
  fichaId?: string;
};

export default function QrCodeView({ fichaId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copiado, setCopiado] = useState(false);

  const urlPublica = useMemo(() => {
    if (!fichaId) return "";
    return `${window.location.origin}/publico/${fichaId}`;
  }, [fichaId]);

  useEffect(() => {
    async function gerarQrCode() {
      if (!canvasRef.current || !urlPublica) return;

      try {
        await QRCode.toCanvas(canvasRef.current, urlPublica, {
          width: 240,
          margin: 2,
          errorCorrectionLevel: "H",
        });
      } catch (error) {
        console.error("Erro ao gerar QR Code:", error);
      }
    }

    gerarQrCode();
  }, [urlPublica]);

  async function copiarLink() {
    if (!urlPublica) return;

    try {
      await navigator.clipboard.writeText(urlPublica);
      setCopiado(true);

      window.setTimeout(() => {
        setCopiado(false);
      }, 2000);
    } catch (error) {
      console.error("Erro ao copiar link:", error);
    }
  }

  function abrirPerfilPublico() {
    if (!urlPublica) return;
    window.open(urlPublica, "_blank", "noopener,noreferrer");
  }

  function baixarQrCode() {
    if (!canvasRef.current || !fichaId) return;

    const image = canvasRef.current.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    link.download = `qrcode-perfil-${fichaId}.png`;
    link.click();
  }

  if (!fichaId) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <h3 style={styles.title}>QR Code</h3>
          <p style={styles.description}>
            Preencha e salve uma ficha funcional para gerar o QR Code do perfil
            público.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h3 style={styles.title}>QR Code do Perfil Público</h3>

        <p style={styles.description}>
          Escaneie este QR Code para abrir o perfil público com as informações
          permitidas para acolhimento e emergência.
        </p>

        <div style={styles.qrBox}>
          <canvas ref={canvasRef} />
        </div>

        <div style={styles.linkBox}>
          <span style={styles.linkLabel}>Link público:</span>
          <div style={styles.linkValue}>{urlPublica}</div>
        </div>

        <div style={styles.buttonGroup}>
          <button type="button" style={styles.primaryButton} onClick={abrirPerfilPublico}>
            Abrir perfil público
          </button>

          <button type="button" style={styles.secondaryButton} onClick={copiarLink}>
            {copiado ? "Link copiado!" : "Copiar link"}
          </button>

          <button type="button" style={styles.secondaryButton} onClick={baixarQrCode}>
            Baixar QR Code
          </button>
        </div>

        <div style={styles.infoBox}>
          <p style={styles.infoText}>
            ⚠️ O perfil público deve exibir apenas dados necessários, preservando
            informações sensíveis conforme a LGPD.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    justifyContent: "center",
    width: "100%",
  },
  card: {
    width: "100%",
    maxWidth: 720,
    background: "#ffffff",
    borderRadius: 20,
    padding: 24,
    boxShadow: "0 10px 30px rgba(156, 74, 143, 0.10)",
    border: "1px solid rgba(156, 74, 143, 0.10)",
  },
  title: {
    margin: 0,
    marginBottom: 12,
    color: "#9c4a8f",
    fontSize: 22,
    fontWeight: 700,
  },
  description: {
    margin: 0,
    marginBottom: 20,
    color: "#2d3436",
    fontSize: 14,
    lineHeight: 1.6,
  },
  qrBox: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    background: "#f8f9fa",
    borderRadius: 18,
    marginBottom: 20,
  },
  linkBox: {
    background: "#faf5fa",
    border: "1px solid rgba(156, 74, 143, 0.15)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    wordBreak: "break-word",
  },
  linkLabel: {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: "#9c4a8f",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  linkValue: {
    fontSize: 13,
    color: "#2d3436",
    lineHeight: 1.5,
  },
  buttonGroup: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 18,
  },
  primaryButton: {
    background: "#9c4a8f",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "12px 18px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
  },
  secondaryButton: {
    background: "#ffffff",
    color: "#9c4a8f",
    border: "1px solid rgba(156, 74, 143, 0.25)",
    borderRadius: 12,
    padding: "12px 18px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
  },
  infoBox: {
    marginTop: 6,
    padding: 14,
    borderRadius: 14,
    background: "#fff8ff",
    border: "1px solid rgba(156, 74, 143, 0.12)",
  },
  infoText: {
    margin: 0,
    fontSize: 12,
    color: "#6b5b68",
    lineHeight: 1.5,
  },
};