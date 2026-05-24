import React from "react";
import { supabase } from "./supabase";

import {
  FaUsers,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function App() {

  const giorniDisponibili = [
    { id: 1, label: "Ven 5 Giugno", data: "2026-06-05" },
    { id: 2, label: "Sab 6 Giugno", data: "2026-06-06" },
    { id: 3, label: "Dom 7 Giugno", data: "2026-06-07" },
    { id: 4, label: "Ven 12 Giugno", data: "2026-06-12" },
    { id: 5, label: "Sab 13 Giugno", data: "2026-06-13" },
    { id: 6, label: "Dom 14 Giugno", data: "2026-06-14" },
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

  const roleColors = {
    Cassa: "from-yellow-400 to-yellow-200",
    Spritz: "from-orange-400 to-orange-200",
    Birra: "from-blue-500 to-blue-300",
    Cocktail: "from-pink-500 to-pink-300",
    Cantinetta: "from-purple-500 to-purple-300",
    Servizio: "from-emerald-500 to-emerald-300",
    Magazzino: "from-slate-500 to-slate-300",
    Assenti: "from-red-500 to-red-300",
  };

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

  const [partecipanti, setPartecipanti] = React.useState([]);

  const [admin, setAdmin] = React.useState(false);

  const [password, setPassword] = React.useState("");

  React.useEffect(() => {
    caricaDati();
  }, []);

  React.useEffect(() => {

    const channel = supabase
      .channel("realtime-partecipanti")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "partecipanti",
        },
        () => {
          caricaDati();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, []);

  const caricaDati = async () => {

    const { data, error } = await supabase
      .from("partecipanti")
      .select("*");

    if (error) {
      console.log(error);
      return;
    }

    setPartecipanti(data || []);
  };

  const loginAdmin = () => {

    if (password === "admin123") {
      setAdmin(true);
    } else {
      alert("Password errata");
    }

  };

  const aggiungiPartecipante = async () => {

    if (!form.nome || !form.cognome) return;

    const nuovo = {
      nome: form.nome,
      cognome: form.cognome,
      ruolo: form.assente ? "Assenti" : form.ruolo,
      orario: form.orario,
      assente: form.assente,
      giorno: giornoAttivo,
    };

    const { error } = await supabase
      .from("partecipanti")
      .insert([nuovo]);

    if (error) {
      console.log(error);
      return;
    }

    caricaDati();

    setForm({
      nome: "",
      cognome: "",
      ruolo: "Cassa",
      orario: "19",
      assente: false,
    });

  };

  const eliminaPartecipante = async (id) => {

    const conferma = window.confirm(
      "Vuoi eliminare questo partecipante?"
    );

    if (!conferma) return;

    const { error } = await supabase
      .from("partecipanti")
      .delete()
      .eq("id", id);

    if (error) {
      console.log(error);
      return;
    }

    caricaDati();

  };

  const partecipantiFiltrati = partecipanti.filter(
    (p) => p.giorno === giornoAttivo
  );

  const totale = partecipantiFiltrati.length;

  const assenti = partecipantiFiltrati.filter(
    (p) => p.assente
  ).length;

  const presenti = totale - assenti;

  const exportPDF = () => {

    const doc = new jsPDF();

    doc.setFontSize(20);

    doc.text(
      `Turni ${giornoAttivo}`,
      14,
      20
    );

    const rows = partecipantiFiltrati.map((p) => [
      p.nome,
      p.cognome,
      p.ruolo,
      p.assente ? "ASSENTE" : `${p.orario}:00`,
    ]);

    autoTable(doc, {
      startY: 30,
      head: [[
        "Nome",
        "Cognome",
        "Ruolo",
        "Orario",
      ]],
      body: rows,
    });

    doc.save(`turni-${giornoAttivo}.pdf`);

  };

  const exportExcel = () => {

    const dati = partecipantiFiltrati.map((p) => ({
      Nome: p.nome,
      Cognome: p.cognome,
      Ruolo: p.ruolo,
      Orario: p.assente
        ? "ASSENTE"
        : `${p.orario}:00`,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dati);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Turni"
    );

    const excelBuffer = XLSX.write(
      workbook,
      {
        bookType: "xlsx",
        type: "array",
      }
    );

    const fileData = new Blob(
      [excelBuffer],
      {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
      }
    );

    saveAs(
      fileData,
      `turni-${giornoAttivo}.xlsx`
    );

  };

  return (

    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 sm:p-6">

      <div className="max-w-7xl mx-auto space-y-6">

        <div className="bg-white rounded-3xl shadow-xl p-4 flex items-center gap-4">

          {!admin ? (

            <>
              <input
                type="password"
                placeholder="Password Admin"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                className="p-3 rounded-2xl border border-slate-200"
              />

              <button
                onClick={loginAdmin}
                className="bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-2xl font-bold"
              >
                Accesso Admin
              </button>
            </>

          ) : (

            <div className="text-green-600 font-bold text-lg">
              ✅ Modalità Admin Attiva
            </div>

          )}

        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

            <div>

              <h1 className="text-4xl sm:text-5xl font-black text-slate-800">
                Gestionale Turni
              </h1>

              <p className="text-slate-500 mt-2">
                Dashboard Staff Evento
              </p>

            </div>

            <div className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-bold shadow-lg">
              Evento Live
            </div>

          </div>

        </div>

        <div className="flex flex-wrap gap-3">

          {giorniDisponibili.map((g) => (

            <button
              key={g.id}
              onClick={() => setGiornoAttivo(g.data)}
              className={`px-5 py-3 rounded-2xl font-bold transition-all shadow-lg ${
                giornoAttivo === g.data
                  ? "bg-indigo-600 text-white scale-105"
                  : "bg-white text-slate-700 hover:bg-slate-100"
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
      className="bg-red-500 hover:bg-red-600 text-white px-6 py-4 rounded-2xl font-bold shadow-lg"
    >
      📄 Export PDF
    </button>

    <button
      onClick={exportExcel}
      className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-4 rounded-2xl font-bold shadow-lg"
    >
      📊 Export Excel
    </button>

  </div>

)}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="bg-white rounded-3xl shadow-xl p-6">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-slate-500">
                  Totale
                </p>

                <h2 className="text-4xl font-bold">
                  {totale}
                </h2>
              </div>

              <FaUsers className="text-4xl text-indigo-500" />

            </div>

          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-slate-500">
                  Presenti
                </p>

                <h2 className="text-4xl font-bold">
                  {presenti}
                </h2>
              </div>

              <FaCheckCircle className="text-4xl text-emerald-500" />

            </div>

          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-slate-500">
                  Assenti
                </p>

                <h2 className="text-4xl font-bold">
                  {assenti}
                </h2>
              </div>

              <FaExclamationCircle className="text-4xl text-red-500" />

            </div>

          </div>

        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8">

          <h2 className="text-3xl font-bold text-slate-800 mb-6">
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
              className="p-4 rounded-2xl border border-slate-200"
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
              className="p-4 rounded-2xl border border-slate-200"
            />

            <select
              value={form.ruolo}
              onChange={(e) =>
                setForm({
                  ...form,
                  ruolo: e.target.value,
                })
              }
              className="p-4 rounded-2xl border border-slate-200"
            >
              {Object.keys(ruoli).map((ruolo) => (
                <option key={ruolo}>
                  {ruolo}
                </option>
              ))}
            </select>

            <select
              value={form.orario}
              onChange={(e) =>
                setForm({
                  ...form,
                  orario: e.target.value,
                })
              }
              className="p-4 rounded-2xl border border-slate-200"
            >
              <option value="19">19</option>
              <option value="20">20</option>
              <option value="21">21</option>
              <option value="22">22</option>
            </select>

            <button
              onClick={aggiungiPartecipante}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl px-6 py-4 shadow-lg"
            >
              ➕ AGGIUNGI
            </button>

          </div>

          <div className="mt-6">

            <label className="flex items-center gap-3 font-bold text-slate-700">

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

              Segna come assente

            </label>

          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          {[...Object.keys(ruoli), "Assenti"].map((ruolo) => {

            const lista = partecipantiFiltrati.filter(
              (p) => p.ruolo === ruolo
            );

            return (

              <div
                key={ruolo}
                className="bg-white rounded-3xl shadow-2xl overflow-hidden"
              >

                <div
                  className={`bg-gradient-to-r ${roleColors[ruolo]} p-5`}
                >

                  <div className="flex items-center justify-between">

                    <h2 className="text-2xl font-black text-slate-800">
                      {ruolo}
                    </h2>

                    <div className="bg-white/70 px-3 py-1 rounded-xl font-bold">
                      {lista.length}
                    </div>

                  </div>

                </div>

                <div className="p-4 space-y-4 min-h-[200px]">

                  {lista.map((p, index) => (

                    <div
                      key={index}
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-4"
                    >

                      <div className="font-bold text-lg text-slate-800">
                        {p.nome} {p.cognome}
                      </div>

                      {!p.assente && (

                        <div className="mt-2 text-slate-500">
                          Arrivo {p.orario}:00
                        </div>

                      )}

                      {admin && (

                        <button
                          onClick={() =>
                            eliminaPartecipante(p.id)
                          }
                          className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-bold w-full"
                        >
                          🗑️ Elimina
                        </button>

                      )}

                    </div>

                  ))}

                </div>

              </div>

            );

          })}

        </div>

      </div>

    </div>

  );

}