class reg {
  # create git user and add authorized tech key
  #
  # create git user
  exec{'user git':
    command => 'adduser --shell /usr/bin/git-shell --disabled-password --gecos "",,,, git',
    creates => '/home/git',
  }
  # create /home/git/.ssh/
  file {'/home/git/.ssh':
    ensure  => 'directory',
    mode    => '0640',
    owner   => 'git',
    group   => 'git',
    require => Exec['user git'],
  }
  # add ssh keys
  file {'authorized_keys':
    path    => '/home/git/.ssh/authorized_keys',
    source  => 'puppet:///modules/reg/home/git/.ssh/authorized_keys',
    ensure  => 'file',
    mode    => '600',
    owner   => 'git',
    group   => 'git',
    require => File['/home/git/.ssh'],
  }
  
  # live dir
  file {'/var/www':
    ensure  => 'directory',
    mode    => '0644',
    owner   => 'git',
    group   => 'git',
    require => Exec['user git'],
  }

  # init git bare repositories
  #
  exec {'/var/git':
    command => 'mkdir /var/git; chown git:git /var/git',
    creates => '/var/git',
    require => File['authorized_keys'],
  }
  # reg
  exec {'reg git':
    command => 'sudo -u git git init --bare registration-server',
    creates => '/var/git/registration-server',
    cwd     => '/var/git',
    require => Exec['/var/git'],
  }
  file {'/var/git/registration-server/hooks/post-receive':
    ensure  => 'file',
    content => template('reg/post-receive.erb'),
    mode    => '775',
    owner   => 'git',
    group   => 'git',
    require => Exec['reg git'],
  }
}
