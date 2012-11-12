register_messages = {
  'INTERNAL_ERROR' : {'message' : 'Erreur interne', 
    'detail' : 'Une erreur système est survenue, l\'administrateur est informé du problème.'},
  'INVALID_DATA' : {'message' : 'Données non-valides', 
    'detail' : 'Une partie des données transmises n\'est pas correcte.'},
  'INVALID_USER_NAME' : { 'message' : 'nom d\'utilisateur non-conforme', 
    'detail' : 'Un nom d\'utilisateur doit être composé de 5 à 21 caractères non accentuées.'},
  'EXISTING_USER_NAME' : { 'message' : 'L\'identifiant existe', 
    'detail' : 'Les identifiants d\'utilisateur doivent être uniques.'},
  'INVALID_PASSWORD' : { 'message' : 'Mot de passe non valide', 
    'detail' : 'Les mots de passes sont composés de 6 à 99 caractères.'},
  
  'INVALID_EMAIL' : { 'message' : 'Adresse e-mail non valide', 
    'detail' : 'le format de l\'adresse e-mail n\'est pas reconnu.'},
  'EXISTING_EMAIL' : { 'message' : 'Cette e-mail est connue', 
      'detail' : 'Cette adresse e-mail est liée a un utilisateur.'},
      
  'INIT_DONE' : { 'message' : 'Enregistrement en cours', 
    'detail' : 'Un e-mail vous a été envoyé. Veuillez consulter votre boite au lettre pour confirmer votre enregistrement.'},

  'ALREADY_CONFIRMED' : { 'message' : 'Déjà confirmé', 
    'detail' : 'Vous avez déjà effectué la confirmation d\'inscription.'},
  'NO_PENDING_CREATION' : { 'message' : 'Aucune création en cours', 
    'detail' : 'Cette création est inconnue ou le temps de validation a expiré.'},
  'INVALID_CHALLENGE' : { 'message' : 'Code de confirmation non-valide', 
    'detail' : 'Il y a une erreur dand le format du code de confirmation.'},
    
  'UNKOWN_USER_NAME' : { 'message' : 'Utilisateur inconnu', 
    'detail' : ''},
  'UNKOWN_EMAIL' : { 'message' : 'Adresse e-mail inconnue', 
      'detail' : ''}, 
    
    'INVALID_KEY' : { 'message' : 'Invalid access request key', 
        'detail' : ''},
        'INVALID_APP_ID' : { 'message' : 'Invalid app ID', 
          'detail' : ''}
};