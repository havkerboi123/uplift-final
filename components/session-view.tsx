'use client';

export type SessionViewProps = {
  appConfig?: any;
  sessionStarted?: boolean;
  disabled?: boolean;
  onHangUp?: () => void;
};

export default function SessionView({ sessionStarted, disabled, onHangUp }: SessionViewProps) {
  // Render nothing; the call experience is handled via the CallModal overlay
  return null;
}
