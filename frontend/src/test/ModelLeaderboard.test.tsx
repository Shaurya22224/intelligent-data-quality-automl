import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ModelLeaderboard } from '../components/automl/ModelLeaderboard';
import { AutoMLTrainResponse } from '../api/types';

describe('ModelLeaderboard Component', () => {
  const mockAutoMLResult: AutoMLTrainResponse = {
    run_id: 'test_run_12345',
    dataset_id: 'dataset_001',
    target_column: 'target',
    task_type: 'classification',
    train_test_split: { train_rows: 80, test_rows: 20 },
    best_model: {
      model_name: 'Random Forest Classifier',
      model_key: 'random_forest',
      algorithm_family: 'Ensemble',
      status: 'success',
      training_time_seconds: 0.12,
      metrics: {
        f1_score: 0.95,
        accuracy: 0.95,
        precision: 0.96,
        recall: 0.94,
        macro_f1: 0.95
      },
      is_best: true,
      rank: 1,
      hyperparameters: {}
    },
    recommendation_summary: 'Winning model recommendation',
    recommendation_details: 'Details on why this model is #1',
    feature_names: ['colA', 'colB'],
    created_at: '2026-10-15T12:00:00Z',
    models: [
      // Pass models out of rank order intentionally to test defensive sorting!
      {
        model_name: 'Decision Tree Classifier',
        model_key: 'decision_tree',
        algorithm_family: 'Tree-Based',
        status: 'success',
        training_time_seconds: 0.05,
        metrics: { f1_score: 0.82, accuracy: 0.82 },
        is_best: false,
        rank: 3,
        hyperparameters: {}
      },
      {
        model_name: 'Support Vector Classifier',
        model_key: 'svc',
        algorithm_family: 'Kernel-Based',
        status: 'skipped',
        skip_reason: 'Incompatible dimensions',
        training_time_seconds: 0.01,
        metrics: {},
        is_best: false,
        rank: null,
        hyperparameters: {}
      },
      {
        model_name: 'Random Forest Classifier',
        model_key: 'random_forest',
        algorithm_family: 'Ensemble',
        status: 'success',
        training_time_seconds: 0.12,
        metrics: { f1_score: 0.95, accuracy: 0.95 },
        is_best: true,
        rank: 1,
        hyperparameters: {}
      },
      {
        model_name: 'Logistic Regression',
        model_key: 'logistic_regression',
        algorithm_family: 'Linear Model',
        status: 'success',
        training_time_seconds: 0.08,
        metrics: { f1_score: 0.88, accuracy: 0.88 },
        is_best: false,
        rank: 2,
        hyperparameters: {}
      }
    ]
  };

  it('renders dynamic evaluated model count and table headers', () => {
    render(<ModelLeaderboard result={mockAutoMLResult} />);
    expect(screen.getByText('4 Models Evaluated')).toBeInTheDocument();
    expect(screen.getByText('AutoML Leaderboard & Model Rankings')).toBeInTheDocument();
  });

  it('defensively sorts models by rank so #1 comes first, followed by #2, #3, and skipped at bottom', () => {
    render(<ModelLeaderboard result={mockAutoMLResult} />);
    
    // Check rank badges
    expect(screen.getByText('#1 Best')).toBeInTheDocument();
    expect(screen.getByText('#2 Rank')).toBeInTheDocument();
    expect(screen.getByText('#3 Rank')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument(); // skipped model badge

    // Check table row order
    const rows = screen.getAllByRole('row');
    // Header is row 0.
    // Row 1 should be rank 1: Random Forest
    expect(rows[1]).toHaveTextContent('Random Forest Classifier');
    expect(rows[1]).toHaveTextContent('#1 Best');

    // Row 2 should be rank 2: Logistic Regression
    expect(rows[2]).toHaveTextContent('Logistic Regression');
    expect(rows[2]).toHaveTextContent('#2 Rank');

    // Row 3 should be rank 3: Decision Tree
    expect(rows[3]).toHaveTextContent('Decision Tree Classifier');
    expect(rows[3]).toHaveTextContent('#3 Rank');

    // Row 4 should be skipped: Support Vector Classifier
    expect(rows[4]).toHaveTextContent('Support Vector Classifier');
    expect(rows[4]).toHaveTextContent('Skipped: Incompatible dimensions');
  });
});
