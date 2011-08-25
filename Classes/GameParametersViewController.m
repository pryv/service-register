//
//  GameParametersViewController.m
//  FlutterApp2
//
//  Created by Dev on 27.12.10.
//  Copyright 2010 Defitech. All rights reserved.
//
//  Implementation of the GameParametersViewController class


#import "GameParametersViewController.h"
#import "DoubleSlider.h"
#import "FlowerController.h"
#import "ParametersManager.h"

@interface GameParametersViewController (PrivateMethods)
- (void)valueChangedForDoubleSlider:(DoubleSlider *)slider;
- (void)editingEndForDoubleSlider:(DoubleSlider *)slider;
@end


@implementation GameParametersViewController


@synthesize mainLabel, minLabel, maxLabel, exerciseTimeLabel, expirationTimeLabel, hoursLabel, minutesLabel, secondsLabel, personalValuesButton;



// The designated initializer.  Override if you create the controller programmatically and want to perform customization that is not appropriate for viewDidLoad.
/*
- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil {
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
        // Custom initialization.
    }
    return self;
}
*/

/*
// Implement loadView to create a view hierarchy programmatically, without using a nib.
- (void)loadView {
}
*/



// Implement viewDidLoad to do additional setup after loading the view, typically from a nib.
- (void)viewDidLoad {
	
    [super viewDidLoad];
	
	mainLabel.text = NSLocalizedString(@"MainLabel", @"Main label of the game parameters view");
    exerciseTimeLabel.text = NSLocalizedString(@"ExerciseTimeLabel", @"Exercise time label");
	expirationTimeLabel.text = NSLocalizedString(@"ExpirationTimeLabel", @"Expiration time label");
	hoursLabel.text = NSLocalizedString(@"HoursLabel", @"Hours label");
	minutesLabel.text = NSLocalizedString(@"MinutesLabel", @"Minutes label");
	secondsLabel.text = NSLocalizedString(@"SecondsLabel", @"Seconds label");
	[personalValuesButton setTitle:NSLocalizedString(@"PersonalValuesButton1Text", @"Text of the personal values button") forState:UIControlStateNormal];
	[personalValuesButton setTitle:NSLocalizedString(@"PersonalValuesButton1Text", @"Text of the personal values button") forState:UIControlStateHighlighted];
	[personalValuesButton setTitle:NSLocalizedString(@"PersonalValuesButton1Text", @"Text of the personal values button") forState:UIControlStateDisabled];
	[personalValuesButton setTitle:NSLocalizedString(@"PersonalValuesButton1Text", @"Text of the personal values button") forState:UIControlStateSelected];
    
    
    
	//DoubleSlider setup
	
	[slider addTarget:self action:@selector(valueChangedForDoubleSlider:) forControlEvents:UIControlEventValueChanged];
    [slider addTarget:self action:@selector(editingEndForDoubleSlider:) forControlEvents:UIControlEventEditingDidEnd];
    
    double target = [[FlowerController currentFlapix] frequenceTarget];
    double toleranceH =  [[FlowerController currentFlapix] frequenceTolerance] / 2;
    
	[slider setSelectedValues:(target - toleranceH) maxValue:(target+ toleranceH)];
	
	//get the initial values
    //slider.transform = CGAffineTransformRotate(slider.transform, 90.0/180*M_PI);      //make it vertical
	[self valueChangedForDoubleSlider:slider];
}



/*
// Override to allow orientations other than the default portrait orientation.
- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation {
    // Return YES for supported orientations.
    return (interfaceOrientation == UIInterfaceOrientationPortrait);
}
*/



#pragma mark Control Event Handlers

- (void)valueChangedForDoubleSlider:(DoubleSlider *)aSlider
{
	minLabel.text = [NSString stringWithFormat:@"%1.1f Hz", aSlider.minSelectedValue];
	maxLabel.text = [NSString stringWithFormat:@"%1.1f Hz", aSlider.maxSelectedValue];
    
    double target = (aSlider.minSelectedValue + aSlider.maxSelectedValue) / 2;
    double tolerance =  aSlider.maxSelectedValue - aSlider.minSelectedValue;
    
    [[FlowerController currentFlapix] SetTargetFrequency:target frequency_tolerance:tolerance];
   
}


- (void)editingEndForDoubleSlider:(DoubleSlider *)aSlider
{
	[self valueChangedForDoubleSlider:aSlider];
    
    double target = (aSlider.minSelectedValue + aSlider.maxSelectedValue) / 2;
    double tolerance =  aSlider.maxSelectedValue - aSlider.minSelectedValue;
    
    [ParametersManager saveFrequency:target tolerance:tolerance];
}



- (void)didReceiveMemoryWarning {
    // Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];
    
    // Release any cached data, images, etc. that aren't in use.
}

- (void)viewDidUnload {
    [super viewDidUnload];
    // Release any retained subviews of the main view.
    // e.g. self.myOutlet = nil;
}


- (void)dealloc {
    [super dealloc];
}




//Allows view to autorotate in all directions
- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation{
	return YES;
}


@end
