import AppLayout from "../../components/AppLayout";

export default function ChurchPanelPage() {
  return (
    <AppLayout title="Painel da Igreja">
      <div
        style={{
          background: "#fff",
          borderRadius: "22px",
          padding: "24px",
          boxShadow: "0 10px 28px rgba(0,0,0,0.05)",
        }}
      >
        <h2 style={{ marginTop: 0, color: "#8f3f85" }}>Painel da Igreja</h2>
        <p>Aqui ficará a gestão da igreja, convites e fichas.</p>
      </div>
    </AppLayout>
  );
}