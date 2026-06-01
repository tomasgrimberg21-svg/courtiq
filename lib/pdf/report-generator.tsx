/**
 * Generación de informes PDF (server-side, @react-pdf/renderer · renderToBuffer).
 * Branding: Meridian Sport Consulting. NO usar en el cliente.
 */
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { LayerResults, UVCategory } from "@/types/metrics";

const C = {
  brand: "#00a85c",
  brandDark: "#0a3d2c",
  ink: "#111119",
  muted: "#5b5b6b",
  line: "#dfe2e8",
};

const styles = StyleSheet.create({
  page: { paddingTop: 0, paddingBottom: 40, paddingHorizontal: 0, fontFamily: "Helvetica", fontSize: 10, color: C.ink },
  band: { backgroundColor: C.brandDark, paddingVertical: 16, paddingHorizontal: 40, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brandName: { color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 14, letterSpacing: 1 },
  brandSub: { color: C.brand, fontSize: 9, letterSpacing: 1 },
  body: { paddingHorizontal: 40, paddingTop: 24 },
  title: { fontFamily: "Helvetica-Bold", fontSize: 20, marginBottom: 2 },
  subtitle: { color: C.muted, fontSize: 11, marginBottom: 16 },
  sectionTitle: { fontFamily: "Helvetica-Bold", fontSize: 11, textTransform: "uppercase", color: C.brand, marginTop: 18, marginBottom: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: C.line },
  label: { color: C.muted },
  value: { fontFamily: "Helvetica-Bold" },
  uvBox: { borderWidth: 2, borderRadius: 6, padding: 10, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  uvScore: { fontFamily: "Helvetica-Bold", fontSize: 22 },
  footer: { position: "absolute", bottom: 18, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", color: C.muted, fontSize: 8, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 6 },
});

function Header() {
  return (
    <View style={styles.band} fixed>
      <View>
        <Text style={styles.brandName}>MERIDIAN SPORT CONSULTING</Text>
        <Text style={styles.brandSub}>ANÁLISIS MONEYBALL · COURTIQ</Text>
      </View>
      <Text style={{ color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 16 }}>
        Court<Text style={{ color: C.brand }}>IQ</Text>
      </Text>
    </View>
  );
}

function Footer({ generatedAt }: { generatedAt: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>Generado el {generatedAt}</Text>
      <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} / ${totalPages}`} />
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export interface PlayerReportData {
  name: string;
  team?: string;
  league?: string;
  season?: string;
  layers: LayerResults;
  uvCategory: UVCategory;
}

function PlayerReport({ title, data, generatedAt }: { title: string; data: PlayerReportData; generatedAt: string }) {
  const { layers, uvCategory } = data;
  return (
    <Document title={title} author="Meridian Sport Consulting">
      <Page size="A4" style={styles.page}>
        <Header />
        <View style={styles.body}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            {[data.team, data.league, data.season].filter(Boolean).join(" · ")}
          </Text>

          <View style={[styles.uvBox, { borderColor: uvCategory.color }]}>
            <Text style={[styles.uvScore, { color: uvCategory.color }]}>{layers.uvScore.toFixed(2)}</Text>
            <Text style={{ color: uvCategory.color, fontFamily: "Helvetica-Bold" }}>{uvCategory.label}</Text>
          </View>

          <Text style={styles.sectionTitle}>Índices integradores</Text>
          <Row label="MBPVI_ARG" value={layers.mbpvi.toFixed(3)} />
          <Row label="UV Score" value={layers.uvScore.toFixed(2)} />
          <Row label="VORP" value={layers.vorp.toFixed(2)} />

          <Text style={styles.sectionTitle}>Eficiencia de tiro</Text>
          <Row label="True Shooting (TS%)" value={`${(layers.ts * 100).toFixed(1)}%`} />
          <Row label="Effective FG (eFG%)" value={`${(layers.efg * 100).toFixed(1)}%`} />
          <Row label="3PAr" value={layers.threePAr.toFixed(2)} />
          <Row label="FTr" value={layers.ftr.toFixed(2)} />

          <Text style={styles.sectionTitle}>Avanzadas</Text>
          <Row label="Four Factors (FF_Score)" value={layers.ffScore.toFixed(3)} />
          <Row label="BPM" value={layers.bpm.toFixed(2)} />
          <Row label="TPI (por 40')" value={layers.tpi.toFixed(1)} />
          <Row label="ORtg" value={layers.ortg.toFixed(1)} />
        </View>
        <Footer generatedAt={generatedAt} />
      </Page>
    </Document>
  );
}

function GenericReport({ title, subtitle, rows, generatedAt }: { title: string; subtitle?: string; rows: { label: string; value: string }[]; generatedAt: string }) {
  return (
    <Document title={title} author="Meridian Sport Consulting">
      <Page size="A4" style={styles.page}>
        <Header />
        <View style={styles.body}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          <Text style={styles.sectionTitle}>Datos</Text>
          {rows.map((r, i) => (
            <Row key={i} label={r.label} value={r.value} />
          ))}
        </View>
        <Footer generatedAt={generatedAt} />
      </Page>
    </Document>
  );
}

export function renderPlayerReport(title: string, data: PlayerReportData, generatedAt: string): Promise<Buffer> {
  return renderToBuffer(<PlayerReport title={title} data={data} generatedAt={generatedAt} />);
}

export function renderGenericReport(
  title: string,
  subtitle: string | undefined,
  rows: { label: string; value: string }[],
  generatedAt: string,
): Promise<Buffer> {
  return renderToBuffer(<GenericReport title={title} subtitle={subtitle} rows={rows} generatedAt={generatedAt} />);
}
