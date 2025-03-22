import './AboutPage.css';

export interface AboutPageProps {}

export default function AboutPage({}: AboutPageProps) {
  return (
    <div className="about-container">
      <h1 className="about-title">About</h1>
      
      <div className="about-section">
        <h2 className="section-title">Zoom Call Manager</h2>
        <p className="version">Version 1.0.0</p>
        
        <p className="section-description">
          Zoom Call Manager is a desktop application designed to simplify the
          management of your Zoom phone calls. It allows you to create custom
          mapping rules between incoming phone number patterns and your Zoom
          phone numbers, helping you maintain a professional communication
          workflow.
        </p>
      </div>

      <div className="about-section">
        <h2 className="section-title">Features</h2>
        <p className="section-description">
          Key capabilities of the Zoom Call Manager application.
        </p>
        <ul className="feature-list">
          <li>Create and manage mapping rules between phone number patterns and Zoom phone numbers</li>
          <li>Set a default caller ID for outgoing calls</li>
          <li>View and manage your call history</li>
          <li>Customize application settings to suit your workflow</li>
        </ul>
      </div>

      <div className="about-section">
        <h2 className="section-title">Technology</h2>
        <p className="section-description">
          Built with Electron and React, providing a smooth cross-platform experience.
        </p>
      </div>

      <div className="about-section">
        <h2 className="section-title">Support</h2>
        <p className="section-description">
          For support or feature requests, please contact your system administrator.
        </p>
      </div>
      
      <div className="footer">
        <p> {new Date().getFullYear()} Zoom Call Manager</p>
      </div>
    </div>
  );
}
