import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { DataProvider } from "./data/DataProvider";
import { CurrentRange } from "./routes/CurrentRange";
import { DecisionTrees } from "./routes/DecisionTrees";
import { Duplication } from "./routes/Duplication";
import { FinancialImpact } from "./routes/FinancialImpact";
import { Ingest } from "./routes/Ingest";
import { Overview } from "./routes/Overview";
import { Planogram } from "./routes/Planogram";
import { Scorecard } from "./routes/Scorecard";

function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <div className="flex min-h-screen bg-canvas">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-8">
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/current-range" element={<CurrentRange />} />
              <Route path="/ingest" element={<Ingest />} />
              <Route path="/decision-trees" element={<DecisionTrees />} />
              <Route path="/scorecard" element={<Scorecard />} />
              <Route path="/duplication" element={<Duplication />} />
              <Route path="/financial-impact" element={<FinancialImpact />} />
              <Route path="/planogram" element={<Planogram />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;
