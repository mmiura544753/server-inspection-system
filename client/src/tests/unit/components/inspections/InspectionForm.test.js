// src/tests/unit/components/inspections/InspectionForm.test.js
import React from 'react';
import { render, screen } from '../../../utils/test-utils';
import InspectionForm from '../../../../components/inspections/InspectionForm';

describe('InspectionForm', () => {
  const mockProps = {
    location: '東京',
    setLocation: jest.fn(),
    workContent: '定期点検',
    setWorkContent: jest.fn(),
  };

  test('renders form elements correctly', () => {
    render(<InspectionForm {...mockProps} />);
    
    // ラベルが正しく表示されているか確認
    expect(screen.getByText('作業場所')).toBeInTheDocument();
    expect(screen.getByText('作業内容')).toBeInTheDocument();
    
    // 入力フィールドの値が正しく設定されているか確認
    const locationInput = screen.getByDisplayValue('東京');
    const workContentInput = screen.getByDisplayValue('定期点検');
    
    expect(locationInput).toBeInTheDocument();
    expect(workContentInput).toBeInTheDocument();
  });

  test('input fields are readonly', () => {
    render(<InspectionForm {...mockProps} />);
    
    const locationInput = screen.getByDisplayValue('東京');
    const workContentInput = screen.getByDisplayValue('定期点検');
    
    expect(locationInput).toHaveAttribute('readOnly');
    expect(workContentInput).toHaveAttribute('readOnly');
  });

  test('has correct CSS classes for styling', () => {
    render(<InspectionForm {...mockProps} />);
    
    const mainContainer = screen.getByText('作業場所').closest('div').parentElement;
    expect(mainContainer).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-4', 'mb-6');
    
    const inputFields = screen.getAllByRole('textbox');
    inputFields.forEach(input => {
      expect(input).toHaveClass('w-full', 'px-3', 'py-2', 'border', 'rounded');
    });
  });
});