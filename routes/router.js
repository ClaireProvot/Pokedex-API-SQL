const Sequelize = require('sequelize');
const Op = Sequelize.Op;


module.exports = (app, db) => {
	//CRUD
	app.get('/allpokemons', (req, res, next) => {
		console.log('all pokemons display from id:', req.query.offset + 1);
		// Get all the pokemons  with offset query and limit : 50
		db.Pokemons.findAndCountAll({
			include: [{
				model: db.Types,
			}],
			limit: 50,
			offset: parseInt(req.query.offset) || 0,
		}).then(result => {
			// if offset < nb pokemons, ok. Else error 404
			if (result.count >= parseInt(req.query.offset) || req.query.offset == undefined) {
				res.status(200).json(result.rows);
			} else {
				res.status(404).send('Not Found');
			};
		}).catch(err => {
			res.status(500).send({
				error: err
			});
		});
	});

	app.get('/pokemons', (req, res) => {
		console.log('Type required is:', req.query.type);
		// Get all the pokemons by type and limit : 50
		if (req.query.type.split(" ").length === 1) {
			db.Pokemons.findAndCountAll({
				// Include JOIN in result
				include: [{
					model: db.Types,
					where: {
						ename: req.query.type,
					},
					required: true
				}],
				limit: 50,
			}).then(result => {
				if (result.count != 0) {
					console.log('Pokemons found', result.count);
					res.status(200).json(result.rows);
				} else {
					res.status(404).send('Not Found');
				}
			})
		} else {
			res.status(404).send('Not Found, only one type accepted');
		};
	});

	app.get('/pokemons/:id', (req, res) => {
		// Get a 'pokemon' by id
		db.Pokemons.findOne({
			include: [{
				all: true
			}],
			where: {
				id: req.params.id,
			}
		}).then(result => {
			res.status(200).json(result);
		});
	});

	app.get('/pokemons/:name', (req, res) => {
		// Get a 'pokemon' by name
		db.Pokemons.findOne({
			include: [{
				all: true
			}],
			where: {
				ename: req.params.name,
			}
		}).then(result => {
			res.status(200).json(result);
		});
	});

	app.put('/pokemons/:id', (req, res) => {
		// Update a 'pokemon'
		db.Pokemons.update({
			ename: req.body.name
		}, {
			where: {
				id: req.params.id,
			}
		}).then(() => {
			return db.Pokemons.findOne({
				include: [{
					all: true
				}],
				where: {
					id: req.params.id,
				}
			});
		}).then(result => {
			res.status(200).json(result);
			console.log(`Pokemon updated is :  ${req.body.ename} `);
		});
	});

	app.post('/pokemons/:id', (req, res) => {
		let pokemonCreated;
		// Create a pokemon
		db.Pokemons.create({
			base: req.body.base,
			cname: req.body.cname,
			ename: req.body.ename,
			id_pokemon: JSON.parse(req.body.id_pokemon),
			jname: req.body.jname,

		}).then((_pokemonCreated) => {
			pokemonCreated = _pokemonCreated;
			// add type1 through the association 'Pokemons-Types'
			if (req.body.type1) {
				// Find the 'type1' in types DB 'Types'
				return db.Types.findOne({
					where: {
						ename: req.body.type1,
					}
				}).then((type1) => {
					// Add 'type1' found to this 'pokemon' through the associate table
					return pokemonCreated.addTypes(
						type1, {
							through: {
								ename: type1.get('ename')
							}
						});
				});
			}
			return Promise.resolve();

		}).then(() => {
			// same type1 : add type2 through the association 'Pokemons-Types'
			if (req.body.type2) {
				return db.Types.findOne({
					where: {
						ename: req.body.type2,
					}
				}).then((type2) => {
					return pokemonCreated.addTypes(
						type2, {
							through: {
								ename: type2.get('ename')
							}
						});
				});
			}
			return Promise.resolve();

		}).then(() => {
			return db.Pokemons.findOne({
				include: [{
					all: true
				}],
				where: {
					id_pokemon: req.params.id,
				}
			});
		}).then(result => {
			res.status(201).json(result);
		});
	});


	app.delete('/pokemons/:id', (req, res) => {
		// Delete a pokemon
		db.Pokemons.destroy({
			where: {
				id: req.params.id,
			}
		}).then(result => {
			res.json({});
		});
	});
};