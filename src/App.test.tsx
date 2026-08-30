import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders source controls and hides visual controls until a source is active', () => {
    render(<App />);

    expect(screen.queryByText(/reactive signal monitor/i)).not.toBeInTheDocument();

    expect(screen.getByRole('button', { name: /share tab audio/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /choose audio file/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /source/i }).closest('.top-right-hud')).not.toBeNull();
    expect(screen.queryByRole('combobox', { name: /visualizer mode/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/prism/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /use aurora theme/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /enter focus mode/i })).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: /local audio file/i })).toBeInTheDocument();
    expect(screen.getByAltText(/vivran logo/i)).toHaveAttribute('src', `${import.meta.env.BASE_URL}vivran-logo.png`);
    expect(screen.getByText(/select an audio source to begin/i)).toBeInTheDocument();
    expect(screen.getByText(/ready/i)).toBeInTheDocument();
  });

  it('keeps focus mode unavailable before a source is selected', () => {
    render(<App />);

    fireEvent.keyDown(window, { key: 'f' });
    expect(screen.queryByRole('button', { name: /enter focus mode/i })).not.toBeInTheDocument();
  });
});
