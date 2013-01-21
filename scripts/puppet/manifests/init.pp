class reg($nodeversion, $redisversion) {
  # package 
  package {
    'tcl8.5': ensure => installed;
  }
  # live dir
  file {'/var/www':
    ensure  => 'directory',
    mode    => '0644',
  }
  # install node for user root
  #
  class{'redissetup':
    redisversion  => $redisversion,
  }
  class{'nodesetup':
    nodeversion => $nodeversion,
  }
}
