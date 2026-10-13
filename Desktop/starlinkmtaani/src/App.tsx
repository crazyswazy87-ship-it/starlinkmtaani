import { useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { PackageGrid } from './components/PackageGrid';
import { PaymentPanel } from './components/PaymentPanel';
import { PendingPanel } from './components/PendingPanel';
import { ConnectedPanel } from './components/ConnectedPanel';
import { ActiveConnectionPanel } from './components/ActiveConnectionPanel';
import { ConnectTvPanel } from './components/ConnectTvPanel';
import { DashboardPanel } from './components/DashboardPanel';
import { TrialCard } from './components/TrialCard';
import { ActionRow, ChartIcon, TvIcon } from './components/layout/ActionRow';
import { useTrial } from './hooks/useTrial';
import { confirmConnect, getActiveSessionForDevice, getSession, getTransactionStatus, initiatePayment } from './services/api';
import type { ActiveSession, DataPackage, Screen, SessionInfo, TransactionStatus } from './types';
import LightRays from './componet/LightRays';



const NETWORK_NAME = 'Starlink Mtaani';
const SUPPORT_PHONE = '+254713112926';
const PAYBILL = '4165193';
const POLL_INTERVAL_MS = 4000;
const POLL_TIMEOUT_MS = 90000;

export default function App() {
  const [screen, setScreen] = useState<Screen>('checking');
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<DataPackage | null>(null);
  const [phone, setPhone] = useState('');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [status, setStatus] = useState<TransactionStatus>('idle');
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // Where to land after a payment that was started from the Connect TV screen.
  const [afterPayment, setAfterPayment] = useState<'tv' | null>(null);
  const freeTrial = useTrial();

  const pollRef = useRef<number | null>(null);
  const pollStartedAt = useRef<number>(0);

  const clearPolling = () => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => clearPolling, []);

  useEffect(() => {
    getActiveSessionForDevice()
      .then((found) => {
        if (found) {
          setActiveSession(found);
          setScreen('active');
        } else {
          setScreen('plans');
        }
      })
      .catch(() => setScreen('plans'));
  }, []);

  // The frontend never decides a payment succeeded on its own. It only
  // reflects whatever status the backend's transaction record holds —
  // and that record only flips to "confirmed" when Safaricom's M-PESA
  // callback (Daraja) has written that confirmation into the database.
  const pollStatus = async (id: string) => {
    try {
      const tx = await getTransactionStatus(id);
      setStatus(tx.status);

      if (tx.status === 'confirmed') {
        clearPolling();
        if (afterPayment === 'tv') {
          setAfterPayment(null);
          setScreen('tv');
          return;
        }
        const sessionInfo = await getSession(id);
        setSession(sessionInfo);
        setScreen('connected');
        return;
      }

      if (tx.status === 'failed') {
        clearPolling();
        return;
      }

      if (Date.now() - pollStartedAt.current > POLL_TIMEOUT_MS) {
        clearPolling();
        setStatus('timeout');
      }
    } catch {
      // transient network error while polling — keep trying until timeout
    }
  };

  const startPolling = (id: string) => {
    clearPolling();
    pollStartedAt.current = Date.now();
    pollRef.current = window.setInterval(() => pollStatus(id), POLL_INTERVAL_MS);
  };

  const handleSelectPackage = (pkg: DataPackage) => {
    setSelectedPackage(pkg);
    setScreen('payment');
  };

  const handleSubmitPayment = async (normalizedPhone: string) => {
    if (!selectedPackage) return;
    setPhone(normalizedPhone);
    const { transactionId: id } = await initiatePayment({
      packageId: selectedPackage.id,
      phone: normalizedPhone
    });
    setTransactionId(id);
    setStatus('pending');
    setScreen('pending');
    startPolling(id);
  };

  const handleSelectPackageFromTv = (pkg: DataPackage) => {
    setAfterPayment('tv');
    handleSelectPackage(pkg);
  };

  const handleSelectPackageFromPlans = (pkg: DataPackage) => {
    setAfterPayment(null);
    handleSelectPackage(pkg);
  };

  const goHome = () => setScreen(session ? 'connected' : activeSession ? 'active' : 'plans');

  const scrollToPackages = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('packages')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  const handleManualRefresh = async () => {
    if (!transactionId) return;
    setRefreshing(true);
    await pollStatus(transactionId);
    setRefreshing(false);
  };

  const handleCancelPending = () => {
    clearPolling();
    setScreen('payment');
  };

  const handleConnectNow = async () => {
    if (!activeSession) return;
    await confirmConnect(activeSession.transactionId);
    const sessionInfo = await getSession(activeSession.transactionId);
    setSession(sessionInfo);
    setScreen('connected');
  };

  const handleNewPackage = () => {
    clearPolling();
    setSelectedPackage(null);
    setTransactionId(null);
    setSession(null);
    setStatus('idle');
    setAfterPayment(null);
    setScreen('plans');
  };

  return (
    <div className="portal-shell">
      {/*Ligh rays*/}
      <div className='light-rays-container'>
        <LightRays
          raysOrigin="top-center"
          raysColor="#ffffff"
          raysSpeed={1}
          lightSpread={0.7}
          rayLength={9}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0}
          distortion={0}
          className="custom-rays"
          pulsating={false}
          fadeDistance={1}
          saturation={1}
      />
      </div>
   
      <div className={`portal-frame${screen === 'dashboard' ? ' portal-frame--wide' : ''}`}>
        <Header screen={screen} supportPhone={SUPPORT_PHONE} network={NETWORK_NAME} />

        {screen === 'checking' && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
            Checking your connection…
          </p>
        )}

        {screen === 'active' && activeSession && (
          <ActiveConnectionPanel
            activeSession={activeSession}
            onConnect={handleConnectNow}
            onViewPackages={() => setScreen('plans')}
            onOpenUsage={() => setScreen('dashboard')}
            onAddDevice={() => setScreen('plans')}
            onConnectTv={() => setScreen('tv')}
          />
        )}

        {screen === 'plans' && (
          <>
            <TrialCard
              trial={freeTrial.trial}
              loading={freeTrial.loading}
              claiming={freeTrial.claiming}
              error={freeTrial.error}
              onClaim={() => void freeTrial.claim()}
              onExpired={() => void freeTrial.refresh()}
              onChoosePlan={scrollToPackages}
            />
            <div id="packages">
              <PackageGrid onSelect={handleSelectPackageFromPlans} />
            </div>
            <div style={{ marginTop: 18 }}>
              <ActionRow
                icon={<TvIcon />}
                title="Connect your TV"
                subtitle="Active package? Your TV is included. Otherwise pick a plan."
                onClick={() => setScreen('tv')}
              />
              <ActionRow
                icon={<ChartIcon />}
                title="My spending"
                subtitle="Payments, totals and subscription history."
                onClick={() => setScreen('dashboard')}
              />
            </div>
          </>
        )}

        {screen === 'tv' && (
          <ConnectTvPanel network={NETWORK_NAME} onBack={goHome} onSelectPackage={handleSelectPackageFromTv} />
        )}

        {screen === 'dashboard' && (
          <DashboardPanel onBack={goHome} onViewPackages={() => setScreen('plans')} />
        )}

        {screen === 'payment' && selectedPackage && (
          <PaymentPanel
            pkg={selectedPackage}
            paybill={PAYBILL}
            accountRef="WIFI-GUEST"
            onBack={() => setScreen('plans')}
            onSubmit={handleSubmitPayment}
          />
        )}

        {screen === 'pending' && selectedPackage && (
          <PendingPanel
            pkg={selectedPackage}
            phone={phone}
            status={status}
            refreshing={refreshing}
            onRefresh={handleManualRefresh}
            onCancel={handleCancelPending}
          />
        )}

        {screen === 'connected' && session && (
          <>
            <ConnectedPanel session={session} onNewPackage={handleNewPackage} />
            <div style={{ marginTop: 18 }}>
              <ActionRow
                icon={<TvIcon />}
                title="Connect your TV"
                subtitle="Included with your active package, no extra payment."
                onClick={() => setScreen('tv')}
              />
              <ActionRow
                icon={<ChartIcon />}
                title="My spending"
                subtitle="Payments, totals and subscription history."
                onClick={() => setScreen('dashboard')}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
