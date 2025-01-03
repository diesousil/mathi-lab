import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchField from './SearchField';

describe('<SearchField />', () => {
  test('it should mount', () => {
    render(<SearchField />);

    const searchField = screen.getByTestId('SearchField');

    expect(searchField).toBeInTheDocument();
  });
});