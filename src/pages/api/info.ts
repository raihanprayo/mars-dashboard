import { NextApiHandler } from 'next';
import config from '_config';

const InfoRoute: NextApiHandler = (req, res) => {
    res.json(config);
};
export default InfoRoute;
