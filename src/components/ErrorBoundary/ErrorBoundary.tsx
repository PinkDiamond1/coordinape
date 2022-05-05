import React, { Component, ErrorInfo, ReactNode } from 'react';

import {
  useSnackbar,
  SnackbarMessage,
  OptionsObject,
  SnackbarKey,
} from 'notistack';

import { EXTERNAL_URL_DISCORD_SUPPORT } from 'routes/paths';
import { reportException } from 'utils/reporting';

interface IInnerProps {
  children: ReactNode;
  enqueueSnackbar: (
    message: SnackbarMessage,
    options?: OptionsObject
  ) => SnackbarKey;
}

interface State {
  hasError: boolean;
  errorMessage?: string;
  errorInfo?: string;
}

class InnerErrorBoundary extends Component<IInnerProps, State> {
  public state: State = {
    hasError: false,
    errorMessage: undefined,
    errorInfo: undefined,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, errorMessage: error.message };
  }

  public componentDidCatch(error: any, errorInfo: ErrorInfo) {
    console.error(
      'Caught in Error boundary:',
      error?.message,
      error,
      errorInfo
    );
    this.props.enqueueSnackbar(
      error?.response?.data?.message ||
        error?.message ||
        'Something went wrong!',
      { variant: 'error' }
    );

    reportException(error, {
      tags: { call_point: 'componentDidCatch' },
      extra: { ...(error.code ? { code: error.code } : {}), ...errorInfo },
    });

    this.setState(state => {
      return {
        ...state,
        errorInfo: errorInfo.componentStack,
        errorMessage: error?.message,
      };
    });
  }

  public render() {
    const infoPieces = this.state.errorInfo?.split('\n') ?? [];
    return !this.state.hasError ? (
      this.props.children
    ) : (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '100vh',
          padding: '0 50px 30px',
        }}
      >
        <div>
          <h5>An uncaught error hit the error boundary.</h5>
          <p>
            Get technical support on{' '}
            <a href={EXTERNAL_URL_DISCORD_SUPPORT}>Discord</a> or refresh to
            return to the app.
          </p>
        </div>
        <div
          style={{
            minWidth: '300px',
            width: '20%',
            fontSize: '14px',
            color: '#555',
          }}
        >
          {JSON.stringify(this.state.errorMessage)}
          <div
            style={{
              marginTop: '10px',
              display: 'flex',
              flexDirection: 'column',
              fontSize: '10px',
            }}
          >
            {infoPieces.map((s, k) => (
              <span key={k}>{s}</span>
            ))}
          </div>
        </div>
      </div>
    );
  }
}

export const ErrorBoundary = ({ children }: { children: ReactNode }) => {
  const { enqueueSnackbar } = useSnackbar();
  return (
    <InnerErrorBoundary enqueueSnackbar={enqueueSnackbar}>
      {children}
    </InnerErrorBoundary>
  );
};
