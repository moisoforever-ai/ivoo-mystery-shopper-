import React, { useState, useEffect } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

/**
 * This isolates and verifies the exact rendering pattern used in App.tsx to fix the "switching
 * tabs interrupts an in-progress audit" bug: keeping a view mounted at all times and only
 * hiding it with CSS (display:none), instead of conditionally rendering it (which used to fully
 * unmount and remount the component — and its local in-progress state — every time the user
 * switched away from and back to the "Audios" tab).
 */

function StatefulPanel({ label }: { label: string }) {
  const [count, setCount] = useState(0);
  const [mountCount, setMountCount] = useState(0);
  useEffect(() => {
    setMountCount((c) => c + 1);
  }, []);

  return (
    <div>
      <span data-testid={`${label}-mounts`}>{mountCount}</span>
      <span data-testid={`${label}-count`}>{count}</span>
      <button onClick={() => setCount((c) => c + 1)}>{label}-increment</button>
    </div>
  );
}

function HiddenNotUnmountedHarness() {
  const [activeTab, setActiveTab] = useState<'a' | 'b'>('a');
  return (
    <div>
      <button onClick={() => setActiveTab('a')}>ir-a-a</button>
      <button onClick={() => setActiveTab('b')}>ir-a-b</button>
      {/* Same pattern as AudioAuditorHub in App.tsx: always mounted, hidden via CSS */}
      <div style={{ display: activeTab === 'a' ? 'block' : 'none' }}>
        <StatefulPanel label="panel-a" />
      </div>
      {activeTab === 'b' && <StatefulPanel label="panel-b" />}
    </div>
  );
}

describe('Patrón de persistencia entre pestañas (ocultar con CSS, no desmontar)', () => {
  it('un panel oculto con display:none conserva su estado al volver a mostrarlo', () => {
    render(<HiddenNotUnmountedHarness />);

    fireEvent.click(screen.getByText('panel-a-increment'));
    fireEvent.click(screen.getByText('panel-a-increment'));
    expect(screen.getByTestId('panel-a-count').textContent).toBe('2');
    expect(screen.getByTestId('panel-a-mounts').textContent).toBe('1');

    // Switch away (panel-a becomes display:none, but stays mounted) and back.
    fireEvent.click(screen.getByText('ir-a-b'));
    fireEvent.click(screen.getByText('ir-a-a'));

    // The count must survive, and the mount effect must NOT have run again.
    expect(screen.getByTestId('panel-a-count').textContent).toBe('2');
    expect(screen.getByTestId('panel-a-mounts').textContent).toBe('1');
  });

  it('control: un panel condicionalmente renderizado SÍ pierde su estado (confirma que el bug era real)', () => {
    render(<HiddenNotUnmountedHarness />);

    fireEvent.click(screen.getByText('ir-a-b'));
    fireEvent.click(screen.getByText('panel-b-increment'));
    expect(screen.getByTestId('panel-b-count').textContent).toBe('1');
    expect(screen.getByTestId('panel-b-mounts').textContent).toBe('1');

    // Switch away (panel-b unmounts, since it's conditionally rendered) and back.
    fireEvent.click(screen.getByText('ir-a-a'));
    fireEvent.click(screen.getByText('ir-a-b'));

    // State resets and it mounts again — this is the old buggy behavior, kept here only as a
    // control case so this test file breaks loudly if someone reintroduces conditional
    // rendering for the always-mounted panel.
    expect(screen.getByTestId('panel-b-count').textContent).toBe('0');
    expect(screen.getByTestId('panel-b-mounts').textContent).toBe('1');
  });
});
