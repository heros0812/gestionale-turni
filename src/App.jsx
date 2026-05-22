import React from "react";
import {
  FaUsers,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";

export default function App() {

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
  };

  const [form, setForm] = React.useState({
    nome: "",
    cognome: "",
    ruolo: "Cassa",
    orario: "19",
  });
  const [admin, setAdmin] = React.useState(false);
  const [password, setPassword] = React.useState("");

 const [partecipanti, setPartecipanti] = React.useState(() => {

  const salvati = localStorage.getItem("partecipanti");

  return salvati ? JSON.parse(salvati) : {
    Cassa: [],
    Spritz: [],
    Birra: [],
    Cocktail: [],
    Cantinetta: [],
    Servizio: [],
    Magazzino: [],
  };

});
React.useEffect(() => {
  localStorage.setItem(
    "partecipanti",
    JSON.stringify(partecipanti)
  );
}, [partecipanti]);
  const aggiungiPartecipante = () => {

    if (!form.nome || !form.cognome) return;

    const nuovo = {
      nome: form.nome,
      cognome: form.cognome,
      orario: form.orario,
      riserva: form.orario !== "19",
    };

    let ruoloFinale = form.ruolo;

    if (partecipanti[form.ruolo].length >= ruoli[form.ruolo]) {
      ruoloFinale = "Servizio";
    }

    const aggiornati = {
      ...partecipanti,
      [ruoloFinale]: [
        ...partecipanti[ruoloFinale],
        nuovo,
      ].sort((a, b) => Number(a.orario) - Number(b.orario)),
    };

    setPartecipanti(aggiornati);

    setForm({
      nome: "",
      cognome: "",
      ruolo: "Cassa",
      orario: "19",
    });
  };
const loginAdmin = () => {

  if (password === "admin123") {
    setAdmin(true);
  } else {
    alert("Password errata");
  }

};
  const totale = Object.values(partecipanti).flat().length;

  const riserve = Object.values(partecipanti)
    .flat()
    .filter((p) => p.riserva).length;

  const titolari = totale - riserve;

  return (

    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-6">

      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-white rounded-3xl shadow-xl p-6 flex items-center gap-4">

  {!admin ? (

    <>
      <input
        type="password"
        placeholder="Password Admin"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="p-4 rounded-2xl border border-slate-200"
      />

      <button
        onClick={loginAdmin}
        className="bg-red-500 hover:bg-red-600 text-white px-6 py-4 rounded-2xl font-bold"
      >
        Accesso Admin
      </button>
    </>

  ) : (

    <div className="text-green-600 font-bold text-xl">
      ✅ Modalità Admin Attiva
    </div>

  )}

</div>

        <div className="bg-white rounded-[30px] shadow-2xl p-8 border border-slate-200">

          <div className="flex items-center justify-between flex-wrap gap-4">

            <div>
              <h1 className="text-5xl font-black text-slate-800">
                Gestionale Turni
              </h1>

              <p className="text-slate-500 mt-2 text-lg">
                Dashboard evento staff
              </p>
            </div>

            <div className="bg-indigo-600 text-white px-6 py-4 rounded-2xl shadow-lg">
              Evento Live
            </div>

          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

          <div className="bg-white rounded-3xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500">Partecipanti</p>
                <h2 className="text-4xl font-bold">{totale}</h2>
              </div>
              <FaUsers className="text-4xl text-indigo-500" />
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500">Titolari</p>
                <h2 className="text-4xl font-bold">{titolari}</h2>
              </div>
              <FaCheckCircle className="text-4xl text-emerald-500" />
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500">Riserve</p>
                <h2 className="text-4xl font-bold">{riserve}</h2>
              </div>
              <FaExclamationCircle className="text-4xl text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500">Orario Start</p>
                <h2 className="text-4xl font-bold">19:00</h2>
              </div>
              <FaClock className="text-4xl text-blue-500" />
            </div>
          </div>

        </div>

        <div className="bg-white rounded-[30px] shadow-2xl p-8">

          <h2 className="text-3xl font-bold mb-8 text-slate-800">
            Inserisci Partecipante
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

            <input
              type="text"
              placeholder="Nome"
              value={form.nome}
              onChange={(e) =>
                setForm({ ...form, nome: e.target.value })
              }
              className="p-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />

            <input
              type="text"
              placeholder="Cognome"
              value={form.cognome}
              onChange={(e) =>
                setForm({ ...form, cognome: e.target.value })
              }
              className="p-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />

            <select
              value={form.ruolo}
              onChange={(e) =>
                setForm({ ...form, ruolo: e.target.value })
              }
              className="p-4 rounded-2xl border border-slate-200"
            >
              {Object.keys(ruoli).map((ruolo) => (
                <option key={ruolo}>{ruolo}</option>
              ))}
            </select>

            <select
              value={form.orario}
              onChange={(e) =>
                setForm({ ...form, orario: e.target.value })
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
              className="bg-indigo-600 hover:bg-indigo-700 transition-all text-white font-bold rounded-2xl px-6 py-4 shadow-lg"
            >
              ➕ AGGIUNGI
            </button>

          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

          {Object.entries(ruoli).map(([ruolo, max]) => (

            <div
              key={ruolo}
              className="bg-white rounded-[30px] shadow-2xl overflow-hidden"
            >

              <div
                className={`bg-gradient-to-r ${roleColors[ruolo]} p-5`}
              >

                <div className="flex items-center justify-between">

                  <h2 className="text-2xl font-black text-slate-800">
                    {ruolo}
                  </h2>

                  <div className="bg-white/70 px-3 py-1 rounded-xl font-bold">
                    {partecipanti[ruolo].length}/{max}
                  </div>

                </div>

              </div>

              <div className="p-4 space-y-4 min-h-[300px]">

                {partecipanti[ruolo].map((p, index) => (

                  <div
                    key={index}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-4 hover:shadow-lg transition"
                  >

                    <div className="font-bold text-lg text-slate-800">
                      {p.nome} {p.cognome}
                    </div>

                    <div className="flex items-center justify-between mt-3">

                      <span className="text-slate-500">
                        Arrivo {p.orario}:00
                      </span>

                      {p.riserva ? (

                        <span className="bg-yellow-300 text-yellow-900 px-3 py-1 rounded-xl font-bold text-sm">
                          RISERVA
                        </span>

                      ) : (

                        <span className="bg-emerald-300 text-emerald-900 px-3 py-1 rounded-xl font-bold text-sm">
                          TITOLARE
                        </span>

                      )}
{admin && (

  <button
  onClick={() => {

    const partecipanteEliminato =
      partecipanti[ruolo][index];

    let nuovaLista =
      partecipanti[ruolo].filter(
        (_, idx) => idx !== index
      );

    if (!partecipanteEliminato.riserva) {

      const primaRiservaIndex =
        nuovaLista.findIndex(p => p.riserva);

      if (primaRiservaIndex !== -1) {

        nuovaLista[primaRiservaIndex] = {
          ...nuovaLista[primaRiservaIndex],
          riserva: false,
        };

      }

    }

    const aggiornati = {
      ...partecipanti,
      [ruolo]: nuovaLista,
    };

    setPartecipanti(aggiornati);

  }}
    className="mt-4 bg-red-500 hover:bg-red-600 text-white w-full py-2 rounded-xl font-bold"
  >
    🗑️ Elimina
  </button>

)}
                    </div>

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