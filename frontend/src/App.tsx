import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Jobs } from './pages/Jobs';
import { Screening } from './pages/Screening';
import { Candidates } from './pages/Candidates';
import { CandidateDetail } from './pages/CandidateDetail';
import { Explainability } from './pages/Explainability';
import { FairnessAudit } from './pages/FairnessAudit';
import { Counterfactual } from './pages/Counterfactual';
import { HumanReview } from './pages/HumanReview';
import { Reports } from './pages/Reports';
import { ModelCard } from './pages/ModelCard';
import { DatasetCard } from './pages/DatasetCard';
import { Recommendations } from './pages/Recommendations';

export const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="screening" element={<Screening />} />
          <Route path="candidates" element={<Candidates />} />
          <Route path="candidates/:id" element={<CandidateDetail />} />
          <Route path="explainability" element={<Explainability />} />
          <Route path="fairness" element={<FairnessAudit />} />
          <Route path="counterfactual" element={<Counterfactual />} />
          <Route path="human-review" element={<HumanReview />} />
          <Route path="reports" element={<Reports />} />
          <Route path="model-card" element={<ModelCard />} />
          <Route path="dataset-card" element={<DatasetCard />} />
          <Route path="recommendations" element={<Recommendations />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
