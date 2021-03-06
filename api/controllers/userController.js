import bcrypt from 'bcryptjs';
import jwt from 'jwt-simple';
import moment from 'moment';
import CryptoJS from "crypto-js";
import User from '../models/userModel.js';
import nodemailer from "nodemailer";
import Address from "../models/addressModel.js";
import Country from "../models/countryModel.js";

export const signUp = (req, res) => {
  // Validate request
  if (!req.body) {
    return res.status(400).send(
      {
        message: "Content can not be empty!"
      }
    );
  }

  const user = new User(
    {
      manager_first_name: req.body.manager_first_name,
      manager_last_name:  req.body.manager_last_name,
      name:               req.body.name,
      description:        req.body.description,
      status:             req.body.status,
      website:            req.body.website,
      email:              req.body.email,
      roles:              JSON.stringify([req.body.roles]),
      username:           req.body.username,
      password:           req.body.password,
      landline:           req.body.landline,
      siret:              req.body.siret,
      photo:              req.file ? req.file.filename : null
    }
  );
  const userAddress = JSON.parse(req.body.address);

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(user.password, salt, (err, hash) => {
      user.password = hash;

      User.register(user, (err, data) => {
        if (err) {
          return res.status(403).send({
            message: err
          });
        }

        const user_id = data.id;

        Country.create(
          new Country(
            {
              label: userAddress.country
            }
          ), (err, data) => {
          if (err) {
            return res.status(500).send({
              message: "Some error occurred while creating the Country."
            });
          }

          Address.create(
            new Address(
              {
                street: userAddress.street,
                city: userAddress.city,
                department: userAddress.department,
                region: userAddress.region,
                zipcode: userAddress.zipcode,
                user_id: user_id,
                country_id: data.id
              }
            ), (err, data) => {
              if (err) {
                  return res.status(500).send({
                      message: "Some error occurred while creating the Address."
                  });
              }

              return res.status(200).send({
                status: "success",
                message: "Account created !"
              });
          });
        });
      });
    });
  });
};

export const login = (req, res) => {
    // Validate request
    if (!req.body) {
        return res.status(400).send({
            message: "Content can not be empty!"
        });
    }

    User.login({
        username: req.body.username,
        email:    req.body.email
    },
    (err, data) => {
        if (err) {
            return res.status(403).send({
                message: "Your identifiers are incorrect !"
            });
        }

        bcrypt.compare(req.body.password, data.password, (error, success) => {
            if (success) {
                const payload = {
                    exp: moment().add(1, 'hour').unix(),
                    iat: moment().unix(),
                    iss: data.id
                };

                let token = jwt.encode(payload, process.env.TOKEN_SECRET);

                return res.status(200).send({
                    username:   data.username,
                    email:      data.email,
                    roles:      data.roles,
                    token:      `Bearer ${token}`,
                    expiration: moment().add(1, 'hour').format('D/MM/YYYY H:m')
                });
            }

            return res.status(403).send({
                message: 'This password is invalid !'
            });
        });
    });
};

// Create and Save a new User
export const create = (req, res) => {
    // Validate request
    if (!req.body) {
        return res.status(400).send({
            message: "Content can not be empty!"
        });
    }

    // Create a User
    const user = new User(
        {
            name:        req.body.name,
            description: req.body.description,
            status:      req.body.status,
            location:    req.body.location,
            website:     req.body.website,
            email:       req.body.email,
            roles:       req.body.roles,
            username:    req.body.username,
            password:    req.body.password,
            siret:       req.body.siret
        }
    );

    bcrypt.genSalt(
        10, (err, salt) => {
            bcrypt.hash(
            user.password, salt, (err, hash) => {
                    user.password = hash;
                    // Save User in the database
                    User.create(
                        user, (err, data) => {
                            if (err) {
                                return res.status(500).send(
                                {
                                    message: "Some error occurred while creating the User."
                                    }
                                );
                            }
                            return res.status(200).send(data);
                        }
                    );
            }
        );
        }
    );
};

export const mail = (req, res) => {
    var transporter = nodemailer.createTransport(
        {
            service: 'gmail',
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PWD
            }
        }
    );

    transporter.verify(
        (error, success) => {
            if (error) {
                res.status(500).json(
                {
                    status: 'Cannot connect to mail inbox'
                }
                    );
            }
        }
    );

    var name    = req.body.name;
    var email   = req.body.email;
    var message = req.body.message;
    var content = `<!DOCTYPE html>
      <html style="margin: 0; padding: 0;">

      <head>
          <title>One | Email template!</title>
      </head>

      <body style="margin: 0; padding: 0;">
          <table class="table" cellpadding="0" cellspacing="0" style="background-color: #eee; empty-cells: hide; margin: 0 auto; padding: 0; width: 600px;">
              <tr>
                <td class="red" style="background-color: #E84C50; margin: 0 auto;">
                  <h3 style="box-sizing: border-box; color: white; font-family: Helvetica, Arial, sans-serif; letter-spacing: 0.5px; line-height: 1.4; margin: 0; padding: 15px 25px; text-align: center; text-transform: uppercase;">
                    Nom
                  </h3>
                </td>
                  <td class="red" style="background-color: #E84C50; margin: 0 auto;">
                     ${name}
                  </td>
              </tr>
              <tr>
                <td class="red" style="background-color: #E84C50; margin: 0 auto;">
                  <h3 style="box-sizing: border-box; color: white; font-family: Helvetica, Arial, sans-serif; letter-spacing: 0.5px; line-height: 1.4; margin: 0; padding: 15px 25px; text-align: center; text-transform: uppercase;">
                    Email
                  </h3>
                </td>
                  <td class="red" style="background-color: #E84C50; margin: 0 auto;">
                     ${email}
                  </td>
              </tr>
              <tr>
                <td class="red" style="background-color: #E84C50; margin: 0 auto;">
                  <h3 style="box-sizing: border-box; color: white; font-family: Helvetica, Arial, sans-serif; letter-spacing: 0.5px; line-height: 1.4; margin: 0; padding: 15px 25px; text-align: center; text-transform: uppercase;">
                    Message
                  </h3>
                </td>
                  <td class="red" style="background-color: #E84C50; margin: 0 auto;">
                     ${message}
                  </td>
              </tr>
          </table>
      </body>

      </html>`;

    var mail = {
        from: process.env.MAIL_USER,
        to: process.env.MAIL_USER,
        subject: 'Demande d\'utilisateur',
        html: '<p>' + content + '<p>'
    };

    transporter.sendMail(
        mail, (err, data) => {
            if (err) {
                res.status(500).json(
                {
                    status: 'error',
                    message: err
                }
                    );
            } else {
        res.status(200).json(
                {
                    status: 'success'
                        }
            );
            }
        }
    );
};

// Retrieve all Users from the database.
export const findAll = (req, res) => {
    User.getAll((err, data) => {
        if (err) {
            return res.status(500).send({
                message: "Some error occurred while retrieving users."
            });
        }

        return res.status(200).send(data);
    });
};

// Find a single User with a id
export const findOne = (req, res) => {
    let id = req.params.id;
    let newId = id.replace(/p1L2u3S/g, '+' ).replace(/s1L2a3S4h/g, '/').replace(/e1Q2u3A4l/g, '=');
    let decryptedId = CryptoJS.AES.decrypt(newId, process.env.SECRET).toString(CryptoJS.enc.Utf8);

    User.findByUsernameOrEmail(decryptedId, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                return res.status(404).send({
                    message: `Not found User with id ${decryptedId}.`
                });
            }

            return res.status(500).send({
                message: "Error retrieving User with id " + decryptedId
            });
        }

        let user = data;

        Address.getAllByUser(user.id, (err, data) => {
            if (err) {
                if (err.kind === "not_found") {
                    return res.status(404).send({
                        message: `Not found User with id ${user.id}.`
                    });
                }

                return res.status(500).send({
                    message: "Error retrieving User with id " + user.id
                });
            }

            user.address = data[0];

            return res.status(200).send(user);
        });
    });
};

// Update a User identified by the id in the request
export const update = (req, res) => {
    // Validate Request
    if (!req.body) {
        return res.status(400).send({
            message: "Content can not be empty!"
        });
    }

    let id = req.params.id;
    let newId = id.replace(/p1L2u3S/g, '+' ).replace(/s1L2a3S4h/g, '/').replace(/e1Q2u3A4l/g, '=');
    let decryptedId = CryptoJS.AES.decrypt(newId, process.env.SECRET).toString(CryptoJS.enc.Utf8);

    User.updateById(
        decryptedId,
        new User(
          {
            manager_first_name: req.body.manager_first_name,
            manager_last_name:  req.body.manager_last_name,
            name:               req.body.name,
            description:        req.body.description,
            status:             req.body.status,
            website:            req.body.website,
            email:              req.body.email,
            roles:              JSON.stringify([req.body.roles]),
            username:           req.body.username,
            password:           req.body.password,
            landline:           req.body.landline,
            siret:              req.body.siret,
            photo:              req.file ? req.file.filename : null
          }
        ),
        (err, data) => {
            if (err) {
                if (err.kind === "not_found") {
                    return res.status(404).send({
                        message: `Not found User with id ${decryptedId}.`
                    });
                }

                return res.status(500).send({
                    message: "Error updating User with id " + decryptedId
                });
            }

            Address.update(
              new Country(
                {
                  label: req.body.address.country,
                }
              ),
              new Address(
                {
                  street: req.body.address.street,
                  city: req.body.address.city,
                  department: req.body.address.department,
                  region: req.body.address.region,
                  zipcode: req.body.address.zipcode,
                  user_id: decryptedId
                }
              ), (err, data) => {
                if (err) {
                  return res.status(500).send({
                    message: "Some error occurred while creating the Address."
                  });
                }

                return res.status(200).send(req.body);
              });
        }
    );
};

// Delete a User with the specified id in the request
export const remove = (req, res) => {
    User.remove(req.params.id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                return res.status(404).send({
                    message: `Not found User with id ${req.params.id}.`
                });
            }

            return res.status(500).send({
                message: "Could not delete User with id " + req.params.id
            });
        }

        return res.status(200).send({
            message: `User was deleted successfully!`
        });
    });
};
