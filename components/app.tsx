// @ts-nocheck
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Room, RoomEvent } from 'livekit-client';
import { motion } from 'motion/react';
import { RoomAudioRenderer, RoomContext, StartAudio } from '@livekit/components-react';
import { toastAlert } from '@/components/alert-toast';
import SessionView from '@/components/session-view';
import { Toaster } from '@/components/ui/sonner';
import Welcome from '@/components/welcome';
import { CallModal } from '@/components/call-modal';
import useConnectionDetails from '@/hooks/useConnectionDetails';
import type { AppConfig } from '@/lib/types';

const MotionWelcome = motion.create(Welcome);
const MotionSessionView = motion.create(SessionView);

interface AppProps {
  appConfig: AppConfig;
}

export function App({ appConfig }: AppProps) {
  const room = useMemo(() => new Room(), []);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any | null>(null);
  const { refreshConnectionDetails, existingOrRefreshConnectionDetails } =
    useConnectionDetails(appConfig);

  useEffect(() => {
    const onDisconnected = () => {
      setSessionStarted(false);
      refreshConnectionDetails();
    };
    const onMediaDevicesError = (error: Error) => {
      toastAlert({
        title: 'Encountered an error with your media devices',
        description: `${error.name}: ${error.message}`,
      });
    };
    room.on(RoomEvent.MediaDevicesError, onMediaDevicesError);
    room.on(RoomEvent.Disconnected, onDisconnected);
    return () => {
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.MediaDevicesError, onMediaDevicesError);
    };
  }, [room, refreshConnectionDetails]);

  useEffect(() => {
    let aborted = false;
    if (sessionStarted && room.state === 'disconnected') {
      Promise.all([
        room.localParticipant.setMicrophoneEnabled(true, undefined, {
          preConnectBuffer: appConfig.isPreConnectBufferEnabled,
        }),
        existingOrRefreshConnectionDetails().then((connectionDetails: any) =>
          room.connect(connectionDetails.serverUrl, connectionDetails.participantToken)
        ),
      ])
        .then(async () => {
          setShowCallModal(true);
          if (reportId && reportData) {
            try {
              await room.localParticipant.publishData(
                new TextEncoder().encode(
                  JSON.stringify({ type: 'medical_report', id: reportId, data: reportData })
                ),
                { reliable: true }
              );
              // Also send a plain text hint some agents expect
              await room.localParticipant.publishData(
                new TextEncoder().encode(`REPORT_ID:${reportId}`),
                { reliable: true }
              );
            } catch {}
          }
        })
        .catch((error) => {
        if (aborted) {
          // Once the effect has cleaned up after itself, drop any errors
          //
          // These errors are likely caused by this effect rerunning rapidly,
          // resulting in a previous run `disconnect` running in parallel with
          // a current run `connect`
          return;
        }

        toastAlert({
          title: 'There was an error connecting to the agent',
          description: `${error.name}: ${error.message}`,
        });
      });
    }
    return () => {
      aborted = true;
      room.disconnect();
    };
  }, [room, sessionStarted, appConfig.isPreConnectBufferEnabled, reportId, reportData]);

  const { startButtonText } = appConfig;

  return (
    <main>
      <MotionWelcome
        key="welcome"
        startButtonText={startButtonText}
        onStartCall={() => setSessionStarted(true)}
        disabled={sessionStarted}
        onAnalyzed={(id: string, data: any) => {
          setReportId(id);
          setReportData(data);
        }}
        initial={{ opacity: 1 }}
        animate={{ opacity: sessionStarted ? 0 : 1 }}
        transition={{ duration: 0.5, ease: 'linear', delay: sessionStarted ? 0 : 0.5 }}
      />

      <RoomContext.Provider value={room}>
        <RoomAudioRenderer />
        <StartAudio label="Start Audio" />
        {/* --- */}
        <MotionSessionView
          key="session-view"
          appConfig={appConfig}
          disabled={!sessionStarted}
          sessionStarted={sessionStarted}
          onHangUp={() => {
            setSessionStarted(false);
            setShowCallModal(false);
            room.disconnect();
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: sessionStarted ? 1 : 0 }}
          transition={{
            duration: 0.5,
            ease: 'linear',
            delay: sessionStarted ? 0.5 : 0,
          }}
        />
        <CallModal open={showCallModal} onHangUp={() => {
          setShowCallModal(false);
          setSessionStarted(false);
          room.disconnect();
        }} />
      </RoomContext.Provider>

      <Toaster />
    </main>
  );
}
