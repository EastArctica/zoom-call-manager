import React from 'react';
import './Banner.css';

interface BannerProps {
  message: string;
  type?: 'info' | 'warning' | 'error';
  actionText?: string;
  onActionClick?: () => void;
}

const Banner: React.FC<BannerProps> = ({
  message,
  type = 'info',
  actionText,
  onActionClick,
}) => {
  return (
    <div className={`banner banner-${type}`}>
      <div className="banner-content">
        <span className="banner-message">{message}</span>
        {actionText && onActionClick && (
          <button className="banner-action" onClick={onActionClick}>
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
};

export default Banner;
