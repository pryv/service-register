class reg($slaveof) {
  $environment = $pryv::environment
  notify{"reg $environment slaveof: $slaveof ":}

  # used by upstart template
  $app = "registration-server"
  $appcode = "reg"   
  $appdir = "${pryv::livedir}/$app"
  $configdest = "$appdir.conf.json"
  
  $nodeversion = 'v0.8.2'
  $redisversion = '2.4.16'

  # package
  package {
    'tcl8.5': ensure => installed;
  }

  setup::unpack{'unpack_mechanism':
    livedir => $pryv::livedir,
    app     => $app,
  }

  # dependencies
  class{'nodesetup': nodeversion => $nodeversion, }
  class{'redis': 
    redisversion  => $redisversion,
    slaveof       => $slaveof,
  }
  
  # app dir
  file {"$appdir":
    ensure  => 'directory',
    mode    => '0644',
    require => File["${pryv::livedir}"],
  }
  
  if ($environment == "staging") {
     secret::ssl{"rec.la": }
     $httpcerts = "${pryv::livedir}/secret/rec.la"
  } else {
     secret::ssl{"pryv.io": }
     $httpcerts = "${pryv::livedir}/secret/pryv.io"
  } 
  
  if ($slaveof) {
    $configname = "dnsonly"
  } else {
    $configname = "master"
  }

  # app conf file
  file {'app config file':
    path    => $configdest,
    ensure  => 'file',
    mode    => '0644',
    content => template("reg/${configname}.${environment}.config.json.erb"),
    require => File["$appdir"],
  }
  
  file {"reg setup script":
    path    =>  "$appdir.setup.bash",
    ensure  => 'file',
    content => template("reg/setup-app.erb"),
    mode    => '755',
    require => File["$appdir"],
  }
   
  file {"upstart":
    path    =>  "/etc/init/reg.conf",
    ensure  => 'file',
    content => template("head/upstart-default-nodeapp-minimal-watch.conf.erb"),
    mode    => '644',
    require => [Exec["supervisor"], File["app config file"]],
  }
}
