class reg($nodeversion, $redisversion, $app, $datadiskname, $redisconffile) {
  notify{"reg datadiskname: $datadiskname redisconffile: $redisconffile":}
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
    datadiskname  => $datadiskname,
    redisconffile => $redisconffile,
  }
  class{'nodesetup':
    nodeversion => $nodeversion,
  }
  exec{'supervisor':
    command => "npm install -g supervisor",
    require => Class["nodesetup"],
  }
  file {"upstart":
    path    => "/etc/init/app.conf",
    ensure  => 'file',
    content => template('reg/app.conf.erb'),
    mode    => '644',
    require => Exec["supervisor"],
  }
}
