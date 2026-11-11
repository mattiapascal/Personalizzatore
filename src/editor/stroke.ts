import { z } from 'zod';
import { EDITOR_LIMITS } from './limits';

/** Physical width in mm. This resource ceiling is not a production constraint. */
export const StrokeWidthSchema = z.number().finite().positive().max(EDITOR_LIMITS.maxStrokeMm);
