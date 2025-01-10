import { useTailSDK, LinkAppModal, App } from '@raccoonai/tail-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

const RACCOON_SECRET_KEY = import.meta.env.VITE_RACCOON_SECRET_KEY as string;
const RACCOON_USER_PASSCODE = import.meta.env.VITE_RACCOON_USER_PASSCODE as string;

// Ideally, you should dynamically load the passcode and secret key from your server

export function RaccoonTail() {
  const tailInstance = useTailSDK({
    secretKey: RACCOON_SECRET_KEY,
    callbacks: {
      onSuccess: (msg) => toast.success(msg),
      onError: (err) => {
        toast.error(err.message);
        console.error(err);
      },
    },
  });

  const [linkModal, setLinkModal] = useState(false);

  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [linkedApps, setLinkedApps] = useState<string[]>([]);
  const [loadingLinkedApps, setLoadingLinkedApps] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLinkedApps = useCallback(async () => {
    try {
      setLoadingLinkedApps(true);
      const apps = await tailInstance.getLinkedApps(RACCOON_USER_PASSCODE);
      setLinkedApps(apps);
    } catch (error) {
      toast.error('Failed to fetch linked apps');
      console.error('Failed to fetch linked apps:', error);
    } finally {
      setLoadingLinkedApps(false);
    }
  }, []);

  useEffect(() => {
    fetchLinkedApps();
  }, [fetchLinkedApps]);

  if (!tailInstance.isLoaded)
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );

  return (
    <div className="sdk-container">
      <h2 className="sdk-title">
      <img src='./logo.svg' alt="Raccoon Logo" height="50px"/> Tail SDK Integration
      </h2>

      <div className="status-bar">
        <span className="status-label">Extension Status:</span>
        <span
          className={`status-badge ${tailInstance.isExtensionInstalled ? 'active' : 'inactive'}`}
        >
          {tailInstance.isExtensionInstalled ? 'Installed' : <>Not Installed. <a href='https://chromewebstore.google.com/detail/raccoon-tail/bnobkjncfheejpehkiaobdgnpmlnjalp'>Install</a></>}
        </span>
      </div>
      <div className="status-bar">
        <span className="status-label">Linked Apps Loading Status:</span>
        <span>
          {loadingLinkedApps ? (
            <div className="loading-spinner-small"></div>
          ) : (
            'Loaded'
          )}
        </span>
      </div>
      <div className="status-bar">
        <span className="status-label">Common Action Loader:</span>
        <span>
          {actionLoading || loadingLinkedApps ? (
            <div className="loading-spinner-small"></div>
          ) : (
            'Loaded'
          )}
        </span>
      </div>

      <div className="apps-grid">
        {tailInstance.availableApps.map((app) => (
          <div key={app.appName} className="app-card">
            <img src={app.icon} alt={app.displayName} className="app-icon" />
            <div className="app-info">
              <h3>{app.displayName}</h3>
              <span className="app-category">{app.category}</span>
            </div>
            {!loadingLinkedApps && (
              <button
                className={`app-action-btn ${linkedApps.includes(app.appName) ? 'unlink' : 'link'}`}
                onClick={async () => {
                  setSelectedApp(app);
                  if (linkedApps.includes(app.appName)) {
                    if (confirm('Are you sure you want to unlink this app?')) {
                      setActionLoading(true);
                      await tailInstance.unlinkApp(
                        app.appName,
                        RACCOON_USER_PASSCODE,
                      );
                      await fetchLinkedApps();
                      setActionLoading(false);
                    }
                  } else {
                    setLinkModal(true);
                  }
                }}
              >
                {linkedApps.includes(app.appName) ? 'Unlink' : 'Link'}
              </button>
            )}
          </div>
        ))}
      </div>

      {selectedApp && (
        <>
          <LinkAppModal
            isModalVisible={linkModal}
            tailInstance={tailInstance}
            app={selectedApp || 'uber'}
            onCancel={() => setLinkModal(false)}
            onOk={fetchLinkedApps}
            raccoonPasscode={RACCOON_USER_PASSCODE}
            // removeBranding={true}
            // compact
            // theme={{
            //   colors: {
            //     button: {
            //       primary: {
            //         text: 'red',
            //         background: 'blue',
            //         hover: 'green',
            //       }
            //     },
            //     background: 'white',
            //     border: 'black',
            //     text: {
            //       primary: 'black',
            //       secondary: 'gray',
            //     },

            //   },
            //   borderRadius: {
            //     modal: '8px',
            //     button: '8px',
            //   },
            //   typography: {
            //     fontFamily: 'Arial',
            //     fontSize: {
            //       title: '24px',
            //       subtitle: '18px',
            //       body: '16px',
            //     }
            //   }
            // }}
          />
        </>
      )}
    </div>
  );
}
