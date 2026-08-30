import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders source and visual controls', () => {
    render(<App />);

    expect(screen.queryByText(/reactive signal monitor/i)).not.toBeInTheDocument();

    expect(screen.getByRole('button', { name: /share tab audio/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /choose audio file/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /visualizer mode/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /spectrum/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /tunnel/i })).toBeInTheDocument();
    expect(screen.getByText(/prism/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /use aurora theme/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /local audio file/i })).toBeInTheDocument();
    expect(screen.getByAltText(/vivran logo/i)).toHaveAttribute('src', '/vivran-logo.png');
    expect(screen.getByText(/ready/i)).toBeInTheDocument();
  });

  it('hides chrome in focus mode and exits with escape or double click', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /enter focus mode/i }));
    expect(screen.queryByLabelText(/visualizer controls/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /vivran/i })).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByLabelText(/visualizer controls/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /enter focus mode/i }));
    fireEvent.doubleClick(screen.getByLabelText(/audio visualizer stage/i));
    expect(screen.getByLabelText(/visualizer controls/i)).toBeInTheDocument();
  });
});
