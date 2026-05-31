import { env } from '../utils/env';

export type SauceUser = {
  username: string;
  password: string;
  /** Short note on the seeded behavior of this account. */
  description: string;
};

export const users = {
  standard: {
    username: 'standard_user',
    password: env.password,
    description: 'Baseline account; everything works as expected.',
  },
  lockedOut: {
    username: 'locked_out_user',
    password: env.password,
    description: 'Login is blocked with a lock-out error.',
  },
  problem: {
    username: 'problem_user',
    password: env.password,
    description: 'Seeded with UI defects (e.g. broken images/inputs).',
  },
  performanceGlitch: {
    username: 'performance_glitch_user',
    password: env.password,
    description: 'Functional but with deliberate latency.',
  },
  error: {
    username: 'error_user',
    password: env.password,
    description: 'Triggers errors in certain flows.',
  },
  visual: {
    username: 'visual_user',
    password: env.password,
    description: 'Seeded with visual/layout defects.',
  },
} satisfies Record<string, SauceUser>;

export const standardUser = users.standard;
