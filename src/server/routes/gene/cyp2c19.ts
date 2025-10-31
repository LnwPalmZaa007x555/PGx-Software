import { Router } from 'express';
import { createCYP2C19, deleteCYP2C19ById, getCYP2C19, getCYP2C19ById, saveToResult, updateCYP2C19ById } from '../../controllers/gene/cyp2c19';

const router = Router();

router.get('/', getCYP2C19);
router.get('/:id', getCYP2C19ById);
router.post('/', createCYP2C19);
router.put('/:id', updateCYP2C19ById);
router.delete('/:id', deleteCYP2C19ById);
router.post('/save', saveToResult);

export default router;
