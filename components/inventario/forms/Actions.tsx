import React from 'react';

type FormActionsProps = {
  loading: boolean;
  error: string | null;
};

const Actions = ({ loading, error }: FormActionsProps) => {
  return (
    <div>
      <button type="submit" disabled={loading}>
        {loading ? 'Procesando...' : 'Dar de Alta Bien'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default Actions;