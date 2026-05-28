import React from "react";
import { supabase } from "./supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function App() {
  // GIORNI EVENTO CORRETTI
  // Ogni giorno deve avere una data unica
  const giorniDisponibili = [
    {
      id: 1,
      label: "Ven 5 Giugno",
      data: "2026-06-05",
    },
    {
      id: 2,
      label: "Sab 6 Giugno",
      data: "2026-06-06",
    },
    {
      id: 3,
      label: "Dom 7 Giugno",
      data: "2026-06-07",
    },
    {
      id: 4,
      label: "Ven 12 Giugno",
      data: "2026-06-12",
    },
    {
      id: 5,
      label: "Sab 13 Giugno",
      data: "2026-06-13",
    },
    {
      id: 6,
      label: "Dom 14 Giugno",
      data: "2026-06-14",
    },
  ];

  const ruoli = {
    Cassa: 4,
    Spritz: 4,
    Birra: 4,
    Cocktail: 6,
    Cantinetta: 3,
    Servizio: 35,
    Magazzino: 6,
  };

  const [partecipanti, setPartecipanti] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [admin, setAdmin] = React.useState(false);
  const [password, setPassword] = React.useState("");

  const [giornoAttivo, setGiornoAttivo] = React.useState(
    giorniDisponibili[0].data
  );

  const [form, setForm] = React.useState({
    nome: "",
    cognome: "",
    ruolo: "Cassa",
    orario: "19",
    assente: false,
  });

  React.useEffect(() => {
    caricaPartecipanti();

    const channel = supabase.channel("realtime-partecipanti");

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "partecipanti",
      },
      () => {
        caricaPartecipanti();
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const caricaPartecipanti = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("partecipanti")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.log(error);
      alert("Errore caricamento partecipanti");
      setLoading(false);
      return;
    }

    setPartecipanti(data || []);
    setLoading(false);
  };

  const loginAdmin = () => {
    if (password === "adminsg") {
      setAdmin(true);
    } else {
      alert("Password errata");
    }
  };

  const eliminaPartecipante = async (id) => {
    const conferma = window.confirm(
      "Eliminare partecipante?"
    );

    if (!conferma) return;

    const { error } = await supabase
      .from("partecipanti")
      .delete()
      .eq("id", id);

    if (error) {
      console.log(error);
      alert("Errore eliminazione");
    }
  };

  const eliminaTutti = async () => {
    const conferma = window.confirm(
      `Eliminare tutti i partecipanti del giorno ${giornoAttivo}?`
    );

    if (!conferma) return;

    const { error } = await supabase
      .from("partecipanti")
      .delete()
      .eq("giorno", giornoAttivo);

    if (error) {
      console.log(error);
      alert("Errore eliminazione");
    }
  };

  const partecipantiOrdinati = partecipanti
    .filter((p) => p.giorno === giornoAttivo)
    .sort((a, b) => {
      const ordine = {
        "17:30": 1,
        "19": 2,
        "20": 3,
        "21": 4,
        "22": 5,
      };

      return ordine[a.orario] - ordine[b.orario];
    });

  const ruoloPieno =
    partecipantiOrdinati.filter(
      (p) =>
        p.giorno === giornoAttivo &&
        p.ruolo === form.ruolo &&
        !p.assente
    ).length >= ruoli[form.ruolo];

  const preparazione = partecipantiOrdinati.filter(
    (p) => p.orario === "17:30" && !p.assente
  );

  const totale = partecipantiOrdinati.length;

  const presenti = partecipantiOrdinati.filter(
    (p) => !p.assente
  ).length;

  const titolari = partecipantiOrdinati.filter(
    (p) =>
      !p.assente &&
      (p.orario === "17:30" || p.orario === "19")
  ).length;

  const riserve = partecipantiOrdinati.filter(
    (p) =>
      !p.assente &&
      p.orario !== "17:30" &&
      p.orario !== "19"
  ).length;

  const aggiungiPartecipante = async () => {
    if (!form.nome || !form.cognome) {
      alert("Inserisci nome e cognome");
      return;
    }

    if (ruoloPieno && !form.assente) {
      alert(`Ruolo ${form.ruolo} pieno`);
      return;
    }

    const nuovo = {
      nome: form.nome,
      cognome: form.cognome,
      ruolo: form.ruolo,
      orario: form.orario,
      giorno: giornoAttivo,
      assente: form.assente,
    };

    const { error } = await supabase
      .from("partecipanti")
      .insert([nuovo]);

    if (error) {
      console.log(error);
      alert("Errore inserimento partecipante");
      return;
    }

    setForm({
      nome: "",
      cognome: "",
      ruolo: "Cassa",
      orario: "19",
      assente: false,
    });
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(20);

    doc.text(`Turni ${giornoAttivo}`, 14, 20);

    const rows = partecipantiOrdinati.map((p) => [
      p.nome,
      p.cognome,
      p.ruolo,
      p.orario,
      p.assente ? "ASSENTE" : "PRESENTE",
    ]);

    autoTable(doc, {
      startY: 30,
      head: [["Nome", "Cognome", "Ruolo", "Orario", "Stato"]],
      body: rows,
    });

    doc.save(`turni-${giornoAttivo}.pdf`);
  };

  const exportExcel = () => {
    const dati = partecipantiOrdinati.map((p) => ({
      Nome: p.nome,
      Cognome: p.cognome,
      Ruolo: p.ruolo,
      Orario: p.orario,
      Stato: p.assente ? "ASSENTE" : "PRESENTE",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dati);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Turni"
    );

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(fileData, `turni-${giornoAttivo}.xlsx`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-3xl font-black text-slate-700">
          Caricamento...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl shadow-xl p-4 flex flex-wrap gap-4 items-center">
          {!admin ? (
            <>
              <input
                type="password"
                placeholder="Password Admin"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                className="border p-3 rounded-xl"
              />

              <button
                onClick={loginAdmin}
                className="bg-red-500 text-white px-5 py-3 rounded-xl font-bold"
              >
                Accesso Admin
              </button>
            </>
          ) : (
            <div className="flex flex-wrap gap-4 items-center">
              <div className="font-bold text-green-600">
                ✅ Modalità Admin
              </div>

              <button
                onClick={eliminaTutti}
                className="bg-black text-white px-5 py-3 rounded-xl font-bold"
              >
                Elimina Tutto
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
          <div>
            <h1 className="text-5xl font-black text-slate-800">
              Gestionale Turni
            </h1>

            <p className="text-slate-500 mt-3">
              Dashboard Staff Evento
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {giorniDisponibili.map((g) => (
              <button
                key={g.id}
                onClick={() =>
                  setGiornoAttivo(g.data)
                }
                className={`px-5 py-3 rounded-2xl font-bold shadow-lg ${
                  giornoAttivo === g.data
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-700"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {admin && (
            <div className="flex flex-wrap gap-4">
              <button
                onClick={exportPDF}
                className="bg-red-500 text-white px-6 py-4 rounded-2xl font-bold shadow-lg"
              >
                Export PDF
              </button>

              <button
                onClick={exportExcel}
                className="bg-emerald-500 text-white px-6 py-4 rounded-2xl font-bold shadow-lg"
              >
                Export Excel
              </button>
            </div>
          )}

          {admin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-3xl shadow-xl p-6 border">
                <p className="text-slate-500">Totale</p>
                <h2 className="text-4xl font-bold">{totale}</h2>
              </div>

              <div className="bg-white rounded-3xl shadow-xl p-6 border">
                <p className="text-slate-500">Presenti</p>
                <h2 className="text-4xl font-bold text-blue-500">
                  {presenti}
                </h2>
              </div>

              <div className="bg-white rounded-3xl shadow-xl p-6 border">
                <p className="text-slate-500">Titolari</p>
                <h2 className="text-4xl font-bold text-green-500">
                  {titolari}
                </h2>
              </div>

              <div className="bg-white rounded-3xl shadow-xl p-6 border">
                <p className="text-slate-500">Riserve</p>
                <h2 className="text-4xl font-bold text-orange-500">
                  {riserve}
                </h2>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 space-y-4">
          <h2 className="text-2xl font-bold">
            Inserisci Partecipante
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Nome"
              value={form.nome}
              onChange={(e) =>
                setForm({
                  ...form,
                  nome: e.target.value,
                })
              }
              className="border p-4 rounded-xl"
            />

            <input
              type="text"
              placeholder="Cognome"
              value={form.cognome}
              onChange={(e) =>
                setForm({
                  ...form,
                  cognome: e.target.value,
                })
              }
              className="border p-4 rounded-xl"
            />

            <select
              value={form.ruolo}
              onChange={(e) =>
                setForm({
                  ...form,
                  ruolo: e.target.value,
                })
              }
              className="border p-4 rounded-xl"
            >
              <option>Cassa</option>
              <option>Spritz</option>
              <option>Birra</option>
              <option>Cocktail</option>
              <option>Cantinetta</option>
              <option>Servizio</option>
              <option>Magazzino</option>
            </select>

            <select
              value={form.orario}
              onChange={(e) =>
                setForm({
                  ...form,
                  orario: e.target.value,
                })
              }
              className="border p-4 rounded-xl"
            >
              <option value="17:30">17:30</option>
              <option value="19">19</option>
              <option value="20">20</option>
              <option value="21">21</option>
              <option value="22">22</option>
            </select>

            <label className="flex items-center gap-3 font-bold border rounded-xl px-4">
              <input
                type="checkbox"
                checked={form.assente}
                onChange={(e) =>
                  setForm({
                    ...form,
                    assente: e.target.checked,
                  })
                }
              />

              Segna assente
            </label>
          </div>

          <button
            onClick={aggiungiPartecipante}
            disabled={ruoloPieno && !form.assente}
            className={`px-6 py-4 rounded-2xl font-bold text-white shadow-lg ${
              ruoloPieno && !form.assente
                ? "bg-red-400 cursor-not-allowed"
                : "bg-indigo-600"
            }`}
          >
            {ruoloPieno && !form.assente
              ? "RUOLO PIENO"
              : "➕ AGGIUNGI"}
          </button>
        </div>

        {preparazione.length > 0 && (
          <div className="bg-white rounded-3xl shadow-xl p-6">
            <h2 className="text-2xl font-bold mb-6">
              Preparazione 17:30
            </h2>

            <div className="space-y-4">
              {preparazione.map((p) => (
                <div
                  key={p.id}
                  className="border rounded-2xl p-4 bg-slate-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-lg">
                        {p.nome} {p.cognome}
                      </div>

                      <div className="text-slate-500">
                        {p.ruolo}
                      </div>
                    </div>

                    <div className="bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold">
                      17:30
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Object.keys(ruoli), "Assenti"].map((ruolo) => (
            <div
              key={ruolo}
              className={`rounded-3xl shadow-2xl overflow-hidden border-4 ${
                ruolo === "Cassa"
                  ? "bg-emerald-50 border-emerald-400"
                  : ruolo === "Spritz"
                  ? "bg-orange-50 border-orange-400"
                  : ruolo === "Birra"
                  ? "bg-yellow-50 border-yellow-400"
                  : ruolo === "Cocktail"
                  ? "bg-pink-50 border-pink-400"
                  : ruolo === "Cantinetta"
                  ? "bg-violet-50 border-violet-400"
                  : ruolo === "Servizio"
                  ? "bg-sky-50 border-sky-400"
                  : ruolo === "Magazzino"
                  ? "bg-slate-100 border-slate-400"
                  : ruolo === "Assenti"
                  ? "bg-red-50 border-red-400"
                  : "bg-white border-slate-300"
              }`}
            >
              <div className="p-5 bg-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-slate-800">
                    {ruolo}
                  </h2>

                  <div className="bg-white px-3 py-1 rounded-xl font-bold">
                    {ruolo === "Assenti"
                      ? partecipantiOrdinati.filter(
                          (p) => p.assente
                        ).length
                      : partecipantiOrdinati.filter(
                          (p) =>
                            p.ruolo === ruolo &&
                            !p.assente
                        ).length}

                    {ruolo !== "Assenti" && (
                      <>/{ruoli[ruolo]}</>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {partecipantiOrdinati
                  .filter((p) => {
                    if (ruolo === "Assenti") {
                      return p.assente;
                    }

                    return (
                      p.ruolo === ruolo &&
                      !p.assente
                    );
                  })
                  .map((p) => (
                    <div
                      key={p.id}
                      className="bg-slate-50 border rounded-2xl p-4"
                    >
                      <div className="font-bold text-lg">
                        {p.nome} {p.cognome}
                      </div>

                      <div className="text-slate-500 mt-1">
                        {p.ruolo}
                      </div>

                      <div
                        className={`mt-3 px-3 py-1 rounded-xl text-xs font-bold text-white inline-block ${
                          p.orario === "19" ||
                          p.orario === "17:30"
                            ? "bg-emerald-500"
                            : "bg-orange-500"
                        }`}
                      >
                        {p.orario === "19" ||
                        p.orario === "17:30"
                          ? "TITOLARE"
                          : "RISERVA"}
                      </div>

                      <div className="mt-3 text-sm font-bold text-slate-700">
                        Orario: {p.orario}
                      </div>

                      {admin && (
                        <button
                          onClick={() =>
                            eliminaPartecipante(p.id)
                          }
                          className="mt-4 bg-red-500 text-white px-4 py-2 rounded-xl font-bold w-full"
                        >
                          Elimina
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
