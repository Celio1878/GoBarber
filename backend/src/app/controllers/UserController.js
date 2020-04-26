import * as YUP from 'yup';
import User from '../models/User';

class UserController {
	async store(req, res) {
		const schema = YUP.object().shape({
			name: YUP.string().required(),
			email: YUP.string().email().required(),
			password: YUP.string().min(6).required(),
		});

		if (!(await schema.isValid(req.body))) {
			return res.status(400).json({ error: 'Validation fails' });
		}

		const userExists = await User.findOne({
			where: { email: req.body.email },
		});

		if (userExists) {
			return res.status(400).json({ error: 'User already exists' });
		}

		const { id, name, email, provider } = await User.create(req.body);

		return res.json({ id, name, email, provider });
	}

	async update(req, res) {
		const schema = YUP.object().shape({
			name: YUP.string(),
			email: YUP.string().email(),
			oldPassword: YUP.string().min(6),
			password: YUP.string()
				.min(6)
				.when('oldPassword', (oldPassword, field) =>
					oldPassword ? field.required() : field
				),
			confirmPassword: YUP.string().when('password', (password, field) =>
				password ? field.required().oneOf([YUP.ref('password')]) : field
			),
		});

		if (!(await schema.isValid(req.body))) {
			return res.status(400).json({ error: 'Validation fails' });
		}

		const { email, oldPassword } = req.body;

		const user = await User.findByPk(req.userId);

		if (email !== user.email) {
			const userExists = await User.findOne({ where: { email } });

			if (userExists) {
				return res.status(400).json({ error: 'User already exists' });
			}
		}

		if (oldPassword && !(await user.checkPassword(oldPassword))) {
			return res.status(401).json({ error: 'Password does not match' });
		}

		const { id, name, provider } = await user.update(req.body);

		return res.json({ id, name, email, provider });
	}
}

export default new UserController();
