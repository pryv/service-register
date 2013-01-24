class reg($nodeversion, $redisversion, $app, $datadiskname, $conffile) {
  notify{"reg datadiskname: $datadiskname conffile: $conffile":}
  # package 
  package {
    'tcl8.5': ensure => installed;
  }
  # live dir
  file {'/var/www':
    ensure  => 'directory',
    mode    => '0644',
  }
  # app conf file
  file {'/var/www/config.json':
    ensure  => 'file',
    mode    => '0644',
    source  => "puppet:///modules/reg/var/www/app/source/$conffile.json",
    require => File['/var/www'],
  }

  # install node for user root
  #
  class{'redissetup':
    redisversion  => $redisversion,
    datadiskname  => $datadiskname,
    conffile      => $conffile,
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
    content => template("reg/$conffile.conf.erb"),
    mode    => '644',
    require => Exec["supervisor"],
  }
}
