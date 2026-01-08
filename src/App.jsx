import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import WeeklyPlanner from './pages/WeeklyPlanner';
import Goals from './pages/Goals';
import Tasks from './pages/Tasks';
import Notes from './pages/Notes';
import Contacts from './pages/Contacts';
import Progress from './pages/Progress';
import Settings from './pages/Settings';

console.log('App.jsx loaded!');

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      <Route path="/dashboard" element={
        <Layout currentPageName="Dashboard">
          <Dashboard />
        </Layout>
      } />
      
      <Route path="/calendar" element={
        <Layout currentPageName="Calendar">
          <Calendar />
        </Layout>
      } />
      
      <Route path="/weeklyplanner" element={
        <Layout currentPageName="WeeklyPlanner">
          <WeeklyPlanner />
        </Layout>
      } />
      
      <Route path="/goals" element={
        <Layout currentPageName="Goals">
          <Goals />
        </Layout>
      } />
      
      <Route path="/tasks" element={
        <Layout currentPageName="Tasks">
          <Tasks />
        </Layout>
      } />
      
      <Route path="/notes" element={
        <Layout currentPageName="Notes">
          <Notes />
        </Layout>
      } />
      
      <Route path="/contacts" element={
        <Layout currentPageName="Contacts">
          <Contacts />
        </Layout>
      } />
      
      <Route path="/progress" element={
        <Layout currentPageName="Progress">
          <Progress />
        </Layout>
      } />
      
      <Route path="/settings" element={
        <Layout currentPageName="Settings">
          <Settings />
        </Layout>
      } />
    </Routes>
  );
}

export default App;